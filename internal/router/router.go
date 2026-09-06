package router

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"

	"github.com/sandi/lumiina/config"
	"github.com/sandi/lumiina/internal/handler"
	"github.com/sandi/lumiina/internal/middleware"
	"github.com/sandi/lumiina/internal/pkg/cloudinary"
	"github.com/sandi/lumiina/internal/pkg/mailer"
	"github.com/sandi/lumiina/internal/repository"
	"github.com/sandi/lumiina/internal/service"
	"github.com/sandi/lumiina/web"
)

// SetupRouter initializes and wires up all middleware, repositories, services, and handlers.
func SetupRouter(cfg *config.Config, db *gorm.DB, rdb *redis.Client, cldService cloudinary.CloudinaryService, mailerService mailer.MailerService) *gin.Engine {
	// Repositories & Services
	followRepo := repository.NewFollowRepository(db)
	followService := service.NewFollowService(followRepo)

	artworkRepo := repository.NewArtworkRepository(db)
	artworkService := service.NewArtworkService(artworkRepo, cldService)
	artworkHandler := handler.NewArtworkHandler(artworkService, rdb, followRepo)

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo, rdb, mailerService, cfg.AppBaseURL, cldService)
	userHandler := handler.NewUserHandler(userService, cfg.JWTSecret, followRepo)

	commentRepo := repository.NewCommentRepository(db)
	commentService := service.NewCommentService(commentRepo)
	commentHandler := handler.NewCommentHandler(commentService, rdb)

	likeRepo := repository.NewLikeRepository(db)
	likeService := service.NewLikeService(likeRepo)
	likeHandler := handler.NewLikeHandler(likeService, rdb)

	bookmarkRepo := repository.NewBookmarkRepository(db)
	bookmarkService := service.NewBookmarkService(bookmarkRepo)
	bookmarkHandler := handler.NewBookmarkHandler(bookmarkService, userRepo, likeRepo, rdb)

	followHandler := handler.NewFollowHandler(followService, userRepo)

	r := gin.Default()
	r.TrustedPlatform = "X-Forwarded-For"

	// Security: Configure trusted proxies
	_ = r.SetTrustedProxies(cfg.TrustedProxies)

	// Global middlewares
	r.Use(middleware.RequestIDMiddleware())
	r.Use(middleware.ErrorHandlerMiddleware())
	r.Use(middleware.TimeoutMiddleware(15 * time.Second))
	r.Use(middleware.CORSMiddleware(cfg.AllowedOrigins...))
	r.Use(middleware.SecurityHeadersMiddleware())
	if os.Getenv("VERCEL") == "" {
		r.Use(gzip.Gzip(
			gzip.DefaultCompression,
			gzip.WithExcludedPaths([]string{"/metrics", "/livez", "/readyz"}),
			gzip.WithMinLength(512),
		))
	}

	// Global Atomic Token Bucket Rate Limiter
	r.Use(middleware.RateLimiterMiddleware(rdb, 300, 1*time.Minute))

	// Health Probes
	r.GET("/livez", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "alive"})
	})

	r.GET("/readyz", func(c *gin.Context) {
		sqlDB, err := db.DB()
		if err != nil || sqlDB.Ping() != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "not ready",
				"reason": "database unreachable",
			})
			return
		}

		if rdb != nil && rdb.Ping(c.Request.Context()).Err() != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "not ready",
				"reason": "redis unreachable",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":   "ready",
			"database": "ok",
			"redis":    "ok",
		})
	})

	// Prometheus Metrics
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	v1 := r.Group("/api/v1")
	authGuard := middleware.AuthMiddleware(cfg.JWTSecret, cfg.JWTSecretOld, rdb)
	optionalAuth := middleware.OptionalAuthMiddleware(cfg.JWTSecret, cfg.JWTSecretOld, rdb)

	// Swagger Docs
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Public routes
	artwork := v1.Group("/artworks")
	{
		artwork.GET("", optionalAuth, artworkHandler.GetAllArtworks)
		artwork.GET("/trending", optionalAuth, artworkHandler.GetTrendingArtworks)
		artwork.GET("/recommended", optionalAuth, artworkHandler.GetRecommendedArtworks)
		artwork.GET("/:id", optionalAuth, artworkHandler.GetArtworkByID)
		artwork.GET("/:id/comments", commentHandler.GetCommentsByArtwork)
		artwork.GET("/:id/bookmark-status", optionalAuth, bookmarkHandler.GetBookmarkStatus)
	}

	// Tags discovery routes
	tags := v1.Group("/tags")
	{
		tags.GET("/popular", optionalAuth, artworkHandler.GetPopularTags)
	}

	// User & Artist discovery routes
	users := v1.Group("/users")
	{
		users.GET("/search", optionalAuth, userHandler.SearchUsers)
		users.GET("/:id", optionalAuth, userHandler.GetUserProfile)
		users.GET("/:id/follow-status", optionalAuth, followHandler.GetFollowStatus)
		users.GET("/:id/followers", optionalAuth, followHandler.GetFollowers)
		users.GET("/:id/following", optionalAuth, followHandler.GetFollowing)
		users.GET("/:id/bookmarks", optionalAuth, bookmarkHandler.GetUserBookmarks)
	}

	rateLimiter := middleware.RateLimiterMiddleware(rdb, 60, 1*time.Minute)
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
		protected.POST("/auth/logout", userHandler.Logout)

		protected.GET("/users/me", userHandler.GetMe)
		protected.PUT("/users/profile", userHandler.UpdateProfile)
		protected.POST("/users/avatar", userHandler.UploadAvatar)
		protected.POST("/users/banner", userHandler.UploadBanner)

		protected.POST("/users/:id/follow", followHandler.ToggleFollow)

		protected.POST("/artworks", artworkHandler.CreateArtwork)
		protected.PUT("/artworks/:id", artworkHandler.UpdateArtwork)
		protected.DELETE("/artworks/:id", artworkHandler.DeleteArtwork)

		protected.POST("/artworks/:id/comments", commentHandler.CreateComment)
		protected.DELETE("/comments/:id", commentHandler.DeleteComment)

		protected.POST("/artworks/:id/like", likeHandler.ToggleLike)

		protected.POST("/artworks/:id/bookmark", bookmarkHandler.ToggleBookmark)
	}

	// Admin routes
	adminOnly := protected.Group("/admin")
	adminOnly.Use(middleware.AdminOnly())
	{
		adminOnly.DELETE("/users/:id", userHandler.AdminDeleteUser)
	}

	// Static web assets & React SPA fallback via embedded filesystem
	subFS, err := web.SubFS()
	if err == nil {
		indexHTML, readErr := web.DistFS.ReadFile("dist/index.html")
		fileServer := http.FileServer(http.FS(subFS))

		if readErr == nil {
			serveIndex := func(c *gin.Context) {
				c.Data(http.StatusOK, "text/html; charset=utf-8", indexHTML)
			}
			r.GET("/", serveIndex)
			r.GET("/index.html", serveIndex)
		}

		r.NoRoute(func(c *gin.Context) {
			if strings.HasPrefix(c.Request.URL.Path, "/api") {
				c.JSON(http.StatusNotFound, gin.H{"error": "API route not found"})
				return
			}

			reqPath := strings.TrimPrefix(c.Request.URL.Path, "/")
			if reqPath == "" || reqPath == "index.html" {
				if readErr == nil {
					c.Data(http.StatusOK, "text/html; charset=utf-8", indexHTML)
					return
				}
			}

			// If file exists in embedded assets (e.g. assets/*.js, favicon.ico, etc.)
			if f, openErr := subFS.Open(reqPath); openErr == nil {
				_ = f.Close()
				fileServer.ServeHTTP(c.Writer, c.Request)
				return
			}

			// SPA fallback: return index.html for client-side routing
			if readErr == nil {
				c.Data(http.StatusOK, "text/html; charset=utf-8", indexHTML)
				return
			}

			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		})
	}

	return r
}
