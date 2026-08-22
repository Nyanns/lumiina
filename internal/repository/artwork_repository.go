package repository

import (
	"github.com/sandi/lumiina/internal/model"
	"gorm.io/gorm"
)

type ArtworkRepository struct {
	db *gorm.DB
}

func NewArtworkRepository(db *gorm.DB) *ArtworkRepository {
	return &ArtworkRepository{db: db}
}

func (r *ArtworkRepository) GetAllArtworks(limit int, offset int) ([]model.Artwork, error) {
	var artworks []model.Artwork

	err := r.db.Preload("Tags").Limit(limit).Offset(offset).Find(&artworks).Error

	return artworks, err
}
