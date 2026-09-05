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
	"github.com/prometheus/client_golang/prometheus/promhttp"
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
	if err := cfg.Validate(); err != nil {
		slog.Error("Configuration validation failed", "error", err)
		os.Exit(1)
	}

	db := config.ConnectDB(cfg)
	if db == nil {
		slog.Error("Failed to connect to database")
		os.Exit(1)
	}

	rdb := config.ConnectRedis(cfg)

	cldService, err := cloudinary.NewCloudinaryService(cfg.CloudinaryURL)
	if err != nil {
		slog.Error("Failed to initialize Cloudinary", "error", err)
		os.Exit(1)
	}

	mailerService := mailer.NewMailerService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPEmail, cfg.SMTPPassword)

	// Dependencies
	followRepo := repository.NewFollowRepository(db)
	followService := service.NewFollowService(followRepo)

	artworkRepo := repository.NewArtworkRepository(db)
	ArtworkService := service.NewArtworkService(artworkRepo, cldService)
	ArtworkHandler := handler.NewArtworkHandler(ArtworkService, rdb, followRepo)

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo, rdb, mailerService, cfg.AppBaseURL, cldService)
	userHandler := handler.NewUserHandler(userService, cfg.JWTSecret, followRepo)

	commentRepo := repository.NewCommentRepository(db)
	commentService := service.NewCommentService(commentRepo)
	commentHandler := handler.NewCommentHandler(commentService, rdb)

	likeRepo := repository.NewLikeRepository(db)
	likeService := service.NewLikeService(likeRepo)
	likeHandler := handler.NewLikeHandler(likeService, rdb)

	followHandler := handler.NewFollowHandler(followService, userRepo)

	r := gin.Default()

	// Security: Configure trusted proxies to prevent IP spoofing & rate-limit bypass
	_ = r.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	// Observability & Security: Global middlewares (RequestID, Recovery, CORS & Security Headers)
	r.Use(middleware.RequestIDMiddleware())
	r.Use(middleware.ErrorHandlerMiddleware())
	r.Use(middleware.TimeoutMiddleware(15 * time.Second))
	r.Use(middleware.CORSMiddleware(cfg.AllowedOrigins...))
	r.Use(middleware.SecurityHeadersMiddleware())

	// Health Probes
	r.GET("/livez", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.GET("/readyz", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		var dbStatus = "ok"
		sqlDB, err := db.DB()
		if err != nil || sqlDB.PingContext(ctx) != nil {
			dbStatus = "unhealthy"
		}

		var redisStatus = "ok"
		if rdb == nil || rdb.Ping(ctx).Err() != nil {
			redisStatus = "unhealthy"
		}

		if dbStatus != "ok" || redisStatus != "ok" {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":   "not ready",
				"database": dbStatus,
				"redis":    redisStatus,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":   "ready",
			"database": "ok",
			"redis":    "ok",
		})
	})

	// Prometheus Metrics Probe
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	v1 := r.Group("/api/v1")
	authGuard := middleware.AuthMiddleware(cfg.JWTSecret, rdb)
	optionalAuth := middleware.OptionalAuthMiddleware(cfg.JWTSecret, rdb)

	// Swagger Docs
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Public routes (optionalAuth extracts user_id for is_liked population)
	artwork := v1.Group("/artworks")
	{
		artwork.GET("", optionalAuth, ArtworkHandler.GetAllArtworks)
		artwork.GET("/trending", optionalAuth, ArtworkHandler.GetTrendingArtworks)
		artwork.GET("/recommended", optionalAuth, ArtworkHandler.GetRecommendedArtworks)
		artwork.GET("/:id", optionalAuth, ArtworkHandler.GetArtworkByID)
		artwork.GET("/:id/comments", commentHandler.GetCommentsByArtwork)
	}

	// Tags discovery routes
	tags := v1.Group("/tags")
	{
		tags.GET("/popular", optionalAuth, ArtworkHandler.GetPopularTags)
	}

	// User & Artist discovery routes
	users := v1.Group("/users")
	{
		users.GET("/search", optionalAuth, userHandler.SearchUsers)
		users.GET("/:id", optionalAuth, userHandler.GetUserProfile)
		users.GET("/:id/follow-status", optionalAuth, followHandler.GetFollowStatus)
		users.GET("/:id/followers", optionalAuth, followHandler.GetFollowers)
		users.GET("/:id/following", optionalAuth, followHandler.GetFollowing)
	}

	rateLimiter := middleware.RateLimiterMiddleware(rdb, 10, 1*time.Minute)
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
		// Session management
		protected.POST("/auth/logout", userHandler.Logout)

		// User profile
		protected.GET("/users/me", userHandler.GetMe)
		protected.PUT("/users/profile", userHandler.UpdateProfile)
		protected.POST("/users/avatar", userHandler.UploadAvatar)
		protected.POST("/users/banner", userHandler.UploadBanner)

		// Follow actions
		protected.POST("/users/:id/follow", followHandler.ToggleFollow)

		protected.POST("/artworks", ArtworkHandler.CreateArtwork)
		protected.PUT("/artworks/:id", ArtworkHandler.UpdateArtwork)
		protected.DELETE("/artworks/:id", ArtworkHandler.DeleteArtwork)

		// Comment routes
		protected.POST("/artworks/:id/comments", commentHandler.CreateComment)
		protected.DELETE("/comments/:id", commentHandler.DeleteComment)

		// Like routes
		protected.POST("/artworks/:id/like", likeHandler.ToggleLike)
	}

	// Admin routes
	adminOnly := protected.Group("/admin")
	adminOnly.Use(middleware.AdminOnly())
	{
		// Admin-only endpoints
	}

	// Server configuration: Hardened against Slowloris & resource exhaustion
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,  // Neutralizes Slowloris header stalls
		ReadTimeout:       30 * time.Second, // Maximum duration reading request
		WriteTimeout:      30 * time.Second, // Maximum duration writing response
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20, // 1 MB max header size
	}

	go func() {
		slog.Info("Server is running with hardened timeouts", "port", cfg.Port)
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
