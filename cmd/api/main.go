package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sandi/lumiina/config"
	_ "github.com/sandi/lumiina/docs"
	"github.com/sandi/lumiina/internal/handler"
	"github.com/sandi/lumiina/internal/middleware"
	"github.com/sandi/lumiina/internal/pkg/cloudinary"
	"github.com/sandi/lumiina/internal/pkg/mailer"
	"github.com/sandi/lumiina/internal/repository"
	"github.com/sandi/lumiina/internal/service"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title Lumiina API
// @version 1.0
// @description Platform sharing fan art anime (Pixiv-like).
// @host localhost:8080
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	cfg := config.LoadConfig()
	db := config.ConnectDB(cfg)
	if db == nil {
		slog.Error("Failed to connect to database")
		os.Exit(1)
	}

	rdb := config.ConnectRedis(cfg)

	if cfg.CloudinaryURL == "" || len(cfg.CloudinaryURL) < 13 || cfg.CloudinaryURL[:13] != "cloudinary://" {
		slog.Error("Invalid CLOUDINARY_SECRET format in .env, must start with 'cloudinary://'")
		os.Exit(1)
	}

	cldService, err := cloudinary.NewCloudinaryService(cfg.CloudinaryURL)
	if err != nil {
		slog.Error("Failed to initialize Cloudinary", "error", err)
		os.Exit(1)
	}

	mailerService := mailer.NewMailerService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPEmail, cfg.SMTPPassword)

	// Dependencies
	artworkRepo := repository.NewArtworkRepository(db)
	ArtworkService := service.NewArtworkService(artworkRepo, cldService)
	ArtworkHandler := handler.NewArtworkHandler(ArtworkService, rdb)

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo, rdb, mailerService, cfg.AppBaseURL)
	userHandler := handler.NewUserHandler(userService, cfg.JWTSecret)

	commentRepo := repository.NewCommentRepository(db)
	commentService := service.NewCommentService(commentRepo)
	commentHandler := handler.NewCommentHandler(commentService)

	r := gin.Default()

	// Security: Configure trusted proxies to prevent IP spoofing & rate-limit bypass
	_ = r.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	// Security: Global middlewares (Recovery, CORS & Security Headers)
	r.Use(middleware.ErrorHandlerMiddleware())
	r.Use(middleware.TimeoutMiddleware(15 * time.Second))
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.SecurityHeadersMiddleware())

	// Health Probes
	r.GET("/livez", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.GET("/readyz", func(c *gin.Context) {
		// In a real app, you might want to ping the DB and Redis here
		c.JSON(http.StatusOK, gin.H{"status": "ready"})
	})

	v1 := r.Group("/api/v1")
	authGuard := middleware.AuthMiddleware(cfg.JWTSecret)

	// Swagger Docs
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Public routes
	artwork := v1.Group("/artworks")
	{
		artwork.GET("", ArtworkHandler.GetAllArtworks)
		artwork.GET("/:id", ArtworkHandler.GetArtworkByID)
		artwork.GET("/:id/comments", commentHandler.GetCommentsByArtwork)
	}

	// User & Artist discovery routes
	users := v1.Group("/users")
	{
		users.GET("/search", userHandler.SearchUsers)
		users.GET("/:id", userHandler.GetUserProfile)
	}

	rateLimiter := middleware.RateLimiterMiddleware(rdb, 5, 1*time.Minute)
	auth := v1.Group("/auth")
	auth.Use(rateLimiter)
	{
		auth.POST("/register", userHandler.Register)
		auth.POST("/login", userHandler.Login)
		auth.GET("/verify-email", userHandler.VerifyEmail)
		auth.POST("/forgot-password", userHandler.ForgotPassword)
		auth.POST("/reset-password", userHandler.ResetPassword)
	}

	// Protected routes
	protected := v1.Group("/")
	protected.Use(authGuard)
	{
		// User profile
		protected.GET("/users/me", userHandler.GetMe)

		protected.POST("/artworks", ArtworkHandler.CreateArtwork)
		protected.PUT("/artworks/:id", ArtworkHandler.UpdateArtwork)
		protected.DELETE("/artworks/:id", ArtworkHandler.DeleteArtwork)

		// Comment routes
		protected.POST("/artworks/:id/comments", commentHandler.CreateComment)
		protected.DELETE("/comments/:id", commentHandler.DeleteComment)
	}

	// Admin routes
	adminOnly := protected.Group("/admin")
	adminOnly.Use(middleware.AdminOnly())
	{
		// Admin-only endpoints
	}

	// Server configuration and graceful shutdown
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		slog.Info("Server is running", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Failed to start server", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	<-quit
	slog.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("Server exited cleanly")
}
