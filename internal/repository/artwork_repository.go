package repository

import (
	"strings"

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

func (r *ArtworkRepository) Create(artwork *model.Artwork, tagNames []string) error {
	var tags []model.Tag

	// Cari tag di DB, kalau belum ada, buat baru (FirstOrCreate)
	for _, name := range tagNames {
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}
		var tag model.Tag
		if err := r.db.Where(model.Tag{Name: name}).FirstOrCreate(&tag).Error; err != nil {
			return err // Gagal memproses tag
		}
		tags = append(tags, tag)
	}

	artwork.Tags = tags // Tempelkan tags ke karya seni
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
