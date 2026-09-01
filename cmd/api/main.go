package main

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sandi/lumiina/config"
	"github.com/sandi/lumiina/internal/handler"
	"github.com/sandi/lumiina/internal/middleware"
	"github.com/sandi/lumiina/internal/pkg/cloudinary"
	"github.com/sandi/lumiina/internal/pkg/mailer"
	"github.com/sandi/lumiina/internal/repository"
	"github.com/sandi/lumiina/internal/service"
)

func main() {
	cfg := config.LoadConfig()
	db := config.ConnectDB(cfg)
	if db == nil {
		log.Fatal("Failed to connect to database")
	}

	rdb := config.ConnectRedis(cfg)

	if cfg.CloudinaryURL == "" || len(cfg.CloudinaryURL) < 13 || cfg.CloudinaryURL[:13] != "cloudinary://" {
		log.Fatal("Invalid CLOUDINARY_SECRET format in .env, must start with 'cloudinary://'")
	}

	cldService, err := cloudinary.NewCloudinaryService(cfg.CloudinaryURL)
	if err != nil {
		log.Fatal("Failed to initialize Cloudinary:", err)
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

	// Security: Global middlewares (CORS & HTTP Security Headers)
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.SecurityHeadersMiddleware())

	v1 := r.Group("/api/v1")
	authGuard := middleware.AuthMiddleware(cfg.JWTSecret)

	// Public routes
	artwork := v1.Group("/artworks")
	{
		artwork.GET("", ArtworkHandler.GetAllArtworks)
		artwork.GET("/:id", ArtworkHandler.GetArtworkByID)
		artwork.GET("/:id/comments", commentHandler.GetCommentsByArtwork)
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

	r.Run(":" + cfg.Port)
}
