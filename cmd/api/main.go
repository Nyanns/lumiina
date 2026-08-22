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

	artworkRepo := repository.NewArtworkRepository(db)
	ArtworkService := service.NewArtworkService(artworkRepo)
	ArtworkHandler := handler.NewArtworkHandler(ArtworkService)

	r := gin.Default()

	v1 := r.Group("/api/v1")
	artwork := v1.Group("/artworks")

	{
		artwork.GET("", ArtworkHandler.GetAllArtworks)
	}

	r.Run(":" + cfg.Port)
}
