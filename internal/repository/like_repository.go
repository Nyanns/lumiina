package repository

import (
	"errors"

	"github.com/sandi/lumiina/internal/model"
	"gorm.io/gorm"
)

type LikeRepository interface {
	ToggleLike(userID uint, artworkID uint) (isLiked bool, newCount int64, err error)
	GetLikeCount(artworkID uint) (int64, error)
	IsUserLiked(userID uint, artworkID uint) (bool, error)
}

type likeRepository struct {
	db *gorm.DB
}

func NewLikeRepository(db *gorm.DB) LikeRepository {
	return &likeRepository{db: db}
}

func (r *likeRepository) ToggleLike(userID uint, artworkID uint) (bool, int64, error) {
	var isLiked bool
	var newCount int64

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// First check if the artwork exists
		var art model.Artwork
		if err := tx.Select("id").First(&art, artworkID).Error; err != nil {
			return err
		}

		var existing model.Like
		err := tx.Where("user_id = ? AND artwork_id = ?", userID, artworkID).First(&existing).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// Create like
				newLike := model.Like{
					UserID:    userID,
					ArtworkID: artworkID,
				}
				if err := tx.Create(&newLike).Error; err != nil {
					return err
				}
				isLiked = true
			} else {
				return err
			}
		} else {
			// Delete like (unlike)
			if err := tx.Delete(&existing).Error; err != nil {
				return err
			}
			isLiked = false
		}

		// Count total likes for this artwork
		if err := tx.Model(&model.Like{}).Where("artwork_id = ?", artworkID).Count(&newCount).Error; err != nil {
			return err
		}

		return nil
	})

	return isLiked, newCount, err
}

func (r *likeRepository) GetLikeCount(artworkID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.Like{}).Where("artwork_id = ?", artworkID).Count(&count).Error
	return count, err
}

func (r *likeRepository) IsUserLiked(userID uint, artworkID uint) (bool, error) {
	if userID == 0 {
		return false, nil
	}
	var count int64
	err := r.db.Model(&model.Like{}).Where("user_id = ? AND artwork_id = ?", userID, artworkID).Count(&count).Error
	return count > 0, err
}
