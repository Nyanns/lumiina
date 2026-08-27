package repository

import (
	"github.com/sandi/lumiina/internal/model"
	"gorm.io/gorm"
)

type CommentRepository interface {
	Create(comment *model.Comment) error
	GetByArtworkID(artworkID uint, limit int, offset int) ([]model.Comment, int64, error)
	GetByID(id uint) (*model.Comment, error)
	Delete(id uint) error
}

type commentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &commentRepository{db: db}
}

func (r *commentRepository) Create(comment *model.Comment) error {
	return r.db.Create(comment).Error
}

func (r *commentRepository) GetByArtworkID(artworkID uint, limit int, offset int) ([]model.Comment, int64, error) {
	var comments []model.Comment
	var total int64

	// Count total comments for pagination metadata
	if err := r.db.Model(&model.Comment{}).Where("artwork_id = ?", artworkID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Query paginated comments and selectively preload User public fields (id, username)
	err := r.db.Where("artwork_id = ?", artworkID).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username")
		}).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&comments).Error

	return comments, total, err
}

func (r *commentRepository) GetByID(id uint) (*model.Comment, error) {
	var comment model.Comment
	err := r.db.First(&comment, id).Error
	return &comment, err
}

func (r *commentRepository) Delete(id uint) error {
	return r.db.Delete(&model.Comment{}, id).Error
}
