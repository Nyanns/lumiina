package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/sandi/lumiina/config"
	"github.com/sandi/lumiina/internal/handler"
	"github.com/sandi/lumiina/internal/repository"
	"github.com/sandi/lumiina/internal/service"
)

func main() {
	cfg := config.LoadConfig()
	db := config.ConnectDB(cfg)
	if db == nil {
		log.Fatal("Gagal konek ke database")
	}

	// Injeksi Dependensi (Perakitan) Artwork
	artworkRepo := repository.NewArtworkRepository(db)
	ArtworkService := service.NewArtworkService(artworkRepo)
	ArtworkHandler := handler.NewArtworkHandler(ArtworkService)

	// Injeksi Dependensi (Perakitan) User
	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	r := gin.Default()
	v1 := r.Group("/api/v1")

	artwork := v1.Group("/artworks")
	{
		artwork.GET("", ArtworkHandler.GetAllArtworks)
	}

	auth := v1.Group("/auth")
	{
		auth.POST("/register", userHandler.Register)
	}

	r.Run(":" + cfg.Port)
}
