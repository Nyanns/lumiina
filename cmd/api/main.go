package main

import (
	"log"

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

	// Inisialisasi Cloudinary
	cldService, err := cloudinary.NewCloudinaryService(cfg.CloudinaryURL)
	if err != nil {
		log.Println("Peringatan: Gagal menginisialisasi Cloudinary:", err)
	}

	// Injeksi Dependensi (Perakitan) Artwork
	artworkRepo := repository.NewArtworkRepository(db)
	ArtworkService := service.NewArtworkService(artworkRepo, cldService)
	ArtworkHandler := handler.NewArtworkHandler(ArtworkService)

	// Injeksi Dependensi (Perakitan) User
	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService, cfg.JWTSecret)

	r := gin.Default()
	v1 := r.Group("/api/v1")

	// 1. Inisialisasi Satpam dengan Secret Key
	authGuard := middleware.AuthMiddleware(cfg.JWTSecret)

	// 2. Route Publik
	artwork := v1.Group("/artworks")
	{
		artwork.GET("", ArtworkHandler.GetAllArtworks)
		artwork.GET("/:id", ArtworkHandler.GetArtworkByID)
	}

	auth := v1.Group("/auth")
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
