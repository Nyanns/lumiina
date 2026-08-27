package main

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sandi/lumiina/config"
	"github.com/sandi/lumiina/internal/handler"
	"github.com/sandi/lumiina/internal/middleware"
	"github.com/sandi/lumiina/internal/pkg/cloudinary"
	"github.com/sandi/lumiina/internal/repository"
	"github.com/sandi/lumiina/internal/service"
)

func main() {
	cfg := config.LoadConfig()
	db := config.ConnectDB(cfg)
	if db == nil {
		log.Fatal("Gagal konek ke database")
	}
	// Hubungkan ke Redis
	rdb := config.ConnectRedis(cfg)

	// Inisialisasi Cloudinary
	if cfg.CloudinaryURL == "" || len(cfg.CloudinaryURL) < 13 || cfg.CloudinaryURL[:13] != "cloudinary://" {
		log.Fatal("Peringatan Keras: CLOUDINARY_SECRET di .env kamu salah format! Harus berawalan 'cloudinary://...'")
	}

	cldService, err := cloudinary.NewCloudinaryService(cfg.CloudinaryURL)
	if err != nil {
		log.Fatal("Gagal menginisialisasi Cloudinary:", err)
	}

	// Injeksi Dependensi (Perakitan) Artwork
	artworkRepo := repository.NewArtworkRepository(db)
	ArtworkService := service.NewArtworkService(artworkRepo, cldService)
	ArtworkHandler := handler.NewArtworkHandler(ArtworkService, rdb)

	// Injeksi Dependensi (Perakitan) User
	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService, cfg.JWTSecret)

	r := gin.Default()

	// 1. Keamanan & Aksesibilitas: Pasang CORS Middleware agar API tidak diblokir oleh Frontend (Vite/React)
	r.Use(middleware.CORSMiddleware())

	v1 := r.Group("/api/v1")

	// 1. Inisialisasi Satpam dengan Secret Key
	authGuard := middleware.AuthMiddleware(cfg.JWTSecret)

	// 2. Route Publik
	artwork := v1.Group("/artworks")
	{
		artwork.GET("", ArtworkHandler.GetAllArtworks)
		artwork.GET("/:id", ArtworkHandler.GetArtworkByID)
	}

	// Buat aturan untuk Satpam: Maksimal 5 kali percobaan dalam 1 menit
	rateLimiter := middleware.RateLimiterMiddleware(rdb, 5, 1*time.Minute)
	auth := v1.Group("/auth")
	auth.Use(rateLimiter)
	{
		auth.POST("/register", userHandler.Register)
		auth.POST("/login", userHandler.Login)
	}

	// 3. Route Privat (Dilindungi Satpam)
	protected := v1.Group("/")
	protected.Use(authGuard)
	{
		protected.POST("/artworks", ArtworkHandler.CreateArtwork)
		protected.PUT("/artworks/:id", ArtworkHandler.UpdateArtwork)
		protected.DELETE("/artworks/:id", ArtworkHandler.DeleteArtwork)
	}

	// 4. Route Super Privat (Dilindungi Satpam + Khusus Admin)
	adminOnly := protected.Group("/admin")
	adminOnly.Use(middleware.AdminOnly())
	{
		// Nanti endpoint seperti Hapus Karya Orang Lain ditaruh di sini
		// Contoh: adminOnly.DELETE("/artworks/:id", ArtworkHandler.DeleteArtworkAsAdmin)
	}

	r.Run(":" + cfg.Port)
}
