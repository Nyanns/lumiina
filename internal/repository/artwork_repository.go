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

func (r *ArtworkRepository) GetAllArtworks(limit int, offset int, search string, tag string, userID uint) ([]model.Artwork, int64, error) {
	var artworks []model.Artwork
	var total int64

	query := r.db.Model(&model.Artwork{})

	if search != "" {
		searchParam := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ?", searchParam, searchParam)
	}

	if userID > 0 {
		query = query.Where("user_id = ?", userID)
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
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&artworks).Error

	return artworks, total, err
}

func (r *ArtworkRepository) Create(artwork *model.Artwork, tagNames []string) error {
	var tags []model.Tag

	for _, name := range tagNames {
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}
		var tag model.Tag
		if err := r.db.Where(model.Tag{Name: name}).FirstOrCreate(&tag).Error; err != nil {
			return err
		}
		tags = append(tags, tag)
	}

	artwork.Tags = tags
	return r.db.Create(artwork).Error
}

func (r *ArtworkRepository) GetByID(id uint) (*model.Artwork, error) {
	var artwork model.Artwork
	err := r.db.Preload("Tags").
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, created_at")
		}).
		First(&artwork, id).Error
	return &artwork, err
}

func (r *ArtworkRepository) Update(artwork *model.Artwork) error {
	return r.db.Save(artwork).Error
}

func (r *ArtworkRepository) Delete(id uint) error {
	return r.db.Delete(&model.Artwork{}, id).Error
}
