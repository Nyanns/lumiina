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

func (r *ArtworkRepository) Create(artwork *model.Artwork) error {
	return r.db.Create(artwork).Error
}

func (r *ArtworkRepository) GetByID(id uint) (*model.Artwork, error) {
	var artwork model.Artwork
	err := r.db.Preload("Tags").First(&artwork, id).Error
	return &artwork, err
}

func (r *ArtworkRepository) Update(artwork *model.Artwork) error {
	return r.db.Save(artwork).Error
}

func (r *ArtworkRepository) Delete(id uint) error {
	return r.db.Delete(&model.Artwork{}, id).Error
}
