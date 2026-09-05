package repository

import (
	"errors"

	"github.com/sandi/lumiina/internal/model"
	"gorm.io/gorm"
)

type BookmarkRepository interface {
	ToggleBookmark(userID uint, artworkID uint) (isBookmarked bool, newCount int64, err error)
	GetBookmarkCount(artworkID uint) (int64, error)
	IsUserBookmarked(userID uint, artworkID uint) (bool, error)
	BatchCheckBookmarked(userID uint, artworkIDs []uint) (map[uint]bool, error)
	GetUserBookmarks(userID uint, limit int, offset int) ([]model.Artwork, int64, error)
}

type bookmarkRepository struct {
	db *gorm.DB
}

func NewBookmarkRepository(db *gorm.DB) BookmarkRepository {
	return &bookmarkRepository{db: db}
}

func (r *bookmarkRepository) ToggleBookmark(userID uint, artworkID uint) (bool, int64, error) {
	var isBookmarked bool
	var newCount int64

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// First verify artwork exists
		var art model.Artwork
		if err := tx.Select("id").First(&art, artworkID).Error; err != nil {
			return err
		}

		var existing model.Bookmark
		err := tx.Where("user_id = ? AND artwork_id = ?", userID, artworkID).First(&existing).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// Create bookmark
				newBookmark := model.Bookmark{
					UserID:    userID,
					ArtworkID: artworkID,
				}
				if err := tx.Create(&newBookmark).Error; err != nil {
					return err
				}
				isBookmarked = true
			} else {
				return err
			}
		} else {
			// Delete bookmark
			if err := tx.Delete(&existing).Error; err != nil {
				return err
			}
			isBookmarked = false
		}

		// Count total bookmarks for this artwork
		if err := tx.Model(&model.Bookmark{}).Where("artwork_id = ?", artworkID).Count(&newCount).Error; err != nil {
			return err
		}

		return nil
	})

	return isBookmarked, newCount, err
}

func (r *bookmarkRepository) GetBookmarkCount(artworkID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.Bookmark{}).Where("artwork_id = ?", artworkID).Count(&count).Error
	return count, err
}

func (r *bookmarkRepository) IsUserBookmarked(userID uint, artworkID uint) (bool, error) {
	if userID == 0 {
		return false, nil
	}
	var count int64
	err := r.db.Model(&model.Bookmark{}).Where("user_id = ? AND artwork_id = ?", userID, artworkID).Count(&count).Error
	return count > 0, err
}

func (r *bookmarkRepository) BatchCheckBookmarked(userID uint, artworkIDs []uint) (map[uint]bool, error) {
	result := make(map[uint]bool)
	if userID == 0 || len(artworkIDs) == 0 {
		return result, nil
	}

	var bookmarkedIDs []uint
	err := r.db.Model(&model.Bookmark{}).
		Where("user_id = ? AND artwork_id IN ?", userID, artworkIDs).
		Pluck("artwork_id", &bookmarkedIDs).Error
	if err != nil {
		return nil, err
	}

	for _, id := range bookmarkedIDs {
		result[id] = true
	}
	return result, nil
}

func (r *bookmarkRepository) GetUserBookmarks(userID uint, limit int, offset int) ([]model.Artwork, int64, error) {
	var total int64
	if err := r.db.Model(&model.Bookmark{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var artworks []model.Artwork
	err := r.db.Model(&model.Artwork{}).
		Joins("INNER JOIN bookmarks ON bookmarks.artwork_id = artworks.id").
		Where("bookmarks.user_id = ?", userID).
		Order("bookmarks.created_at DESC").
		Limit(limit).
		Offset(offset).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, display_name, avatar_url, role")
		}).
		Preload("Tags").
		Find(&artworks).Error

	return artworks, total, err
}
