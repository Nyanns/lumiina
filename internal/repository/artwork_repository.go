package repository

import (
	"strings"

	"github.com/sandi/lumiina/internal/model"
	"gorm.io/gorm"
)

type ArtworkRepository interface {
	GetAllArtworks(limit int, offset int, search string, tag string, userID uint) ([]model.Artwork, int64, error)
	Create(artwork *model.Artwork, tagNames []string) error
	GetByID(id uint) (*model.Artwork, error)
	Update(artwork *model.Artwork) error
	Delete(id uint) error
}

type artworkRepository struct {
	db *gorm.DB
}

func NewArtworkRepository(db *gorm.DB) ArtworkRepository {
	return &artworkRepository{db: db}
}

func (r *artworkRepository) GetAllArtworks(limit int, offset int, search string, tag string, userID uint) ([]model.Artwork, int64, error) {
	var artworks []model.Artwork
	var total int64

	query := r.db.Model(&model.Artwork{})

	if search != "" {
		searchParam := "%" + search + "%"
		query = query.Where("title ILIKE ? OR description ILIKE ?", searchParam, searchParam)
	}

	if userID > 0 {
		query = query.Where("artworks.user_id = ?", userID)
	}

	if tag != "" {
		query = query.Joins("JOIN artwork_tags ON artwork_tags.artwork_id = artworks.id").
			Joins("JOIN tags ON tags.id = artwork_tags.tag_id").
			Where("LOWER(tags.name) = ?", strings.ToLower(tag))
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Preload("Tags").
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, created_at")
		}).
		Order("artworks.created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&artworks).Error

	return artworks, total, err
}

func (r *artworkRepository) Create(artwork *model.Artwork, tagNames []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var tags []model.Tag

		for _, name := range tagNames {
			name = strings.TrimSpace(name)
			if name == "" {
				continue
			}
			var tag model.Tag
			if err := tx.Where(model.Tag{Name: name}).FirstOrCreate(&tag).Error; err != nil {
				return err
			}
			tags = append(tags, tag)
		}

		artwork.Tags = tags
		return tx.Create(artwork).Error
	})
}

func (r *artworkRepository) GetByID(id uint) (*model.Artwork, error) {
	var artwork model.Artwork
	err := r.db.Preload("Tags").
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, created_at")
		}).
		First(&artwork, id).Error
	return &artwork, err
}

func (r *artworkRepository) Update(artwork *model.Artwork) error {
	return r.db.Save(artwork).Error
}

func (r *artworkRepository) Delete(id uint) error {
	return r.db.Delete(&model.Artwork{}, id).Error
}
