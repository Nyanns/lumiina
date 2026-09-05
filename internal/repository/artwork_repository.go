package repository

import (
	"strings"

	"github.com/sandi/lumiina/internal/model"
	"gorm.io/gorm"
)

type ArtworkRepository interface {
	GetAllArtworks(limit int, offset int, search string, tag string, userID uint, currentUserID uint) ([]model.Artwork, int64, error)
	GetTrendingArtworks(limit int, currentUserID uint) ([]model.Artwork, error)
	GetRecommendedArtworks(userID uint, limit int) ([]model.Artwork, error)
	GetPopularTags(userID uint, limit int) ([]model.Tag, error)
	Create(artwork *model.Artwork, tagNames []string) error
	GetByID(id uint) (*model.Artwork, error)
	GetByIDForUser(id uint, currentUserID uint) (*model.Artwork, error)
	Update(artwork *model.Artwork) error
	Delete(id uint) error
}

type artworkRepository struct {
	db *gorm.DB
}

func NewArtworkRepository(db *gorm.DB) ArtworkRepository {
	return &artworkRepository{db: db}
}

func (r *artworkRepository) GetAllArtworks(limit int, offset int, search string, tag string, userID uint, currentUserID uint) ([]model.Artwork, int64, error) {
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
			return db.Select("id, username, display_name, avatar_url, banner_url, is_verified, created_at")
		}).
		Order("artworks.created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&artworks).Error

	if err == nil {
		r.populateCommentCounts(artworks)
		r.populateLikeCounts(artworks)
		r.populateUserLikeStatus(artworks, currentUserID)
	}

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
			return db.Select("id, username, display_name, avatar_url, banner_url, is_verified, created_at")
		}).
		First(&artwork, id).Error
	if err != nil {
		return nil, err
	}

	var count int64
	_ = r.db.Model(&model.Comment{}).Where("artwork_id = ?", id).Count(&count).Error
	artwork.CommentCount = count

	var likeCount int64
	_ = r.db.Model(&model.Like{}).Where("artwork_id = ?", id).Count(&likeCount).Error
	artwork.LikeCount = likeCount

	return &artwork, nil
}

func (r *artworkRepository) GetByIDForUser(id uint, currentUserID uint) (*model.Artwork, error) {
	artwork, err := r.GetByID(id)
	if err != nil {
		return nil, err
	}
	if currentUserID > 0 {
		var likedCount int64
		_ = r.db.Model(&model.Like{}).Where("user_id = ? AND artwork_id = ?", currentUserID, id).Count(&likedCount).Error
		artwork.IsLiked = likedCount > 0
	}
	return artwork, nil
}

func (r *artworkRepository) Update(artwork *model.Artwork) error {
	return r.db.Save(artwork).Error
}

func (r *artworkRepository) Delete(id uint) error {
	return r.db.Delete(&model.Artwork{}, id).Error
}

func (r *artworkRepository) GetTrendingArtworks(limit int, currentUserID uint) ([]model.Artwork, error) {
	var artworks []model.Artwork
	err := r.db.Model(&model.Artwork{}).
		Preload("Tags").
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, display_name, avatar_url, banner_url, is_verified, created_at")
		}).
		Joins("LEFT JOIN comments ON comments.artwork_id = artworks.id").
		Group("artworks.id").
		Order("COUNT(comments.id) DESC, artworks.created_at DESC").
		Limit(limit).
		Find(&artworks).Error

	if err == nil {
		r.populateCommentCounts(artworks)
		r.populateLikeCounts(artworks)
		r.populateUserLikeStatus(artworks, currentUserID)
	}

	return artworks, err
}

func (r *artworkRepository) GetRecommendedArtworks(userID uint, limit int) ([]model.Artwork, error) {
	var artworks []model.Artwork

	if userID > 0 {
		var userTagIDs []uint
		_ = r.db.Table("artwork_tags").
			Joins("JOIN artworks ON artworks.id = artwork_tags.artwork_id").
			Where("artworks.user_id = ?", userID).
			Pluck("DISTINCT artwork_tags.tag_id", &userTagIDs).Error

		if len(userTagIDs) > 0 {
			err := r.db.Model(&model.Artwork{}).
				Preload("Tags").
				Preload("User", func(db *gorm.DB) *gorm.DB {
					return db.Select("id, username, display_name, avatar_url, banner_url, is_verified, created_at")
				}).
				Joins("JOIN artwork_tags ON artwork_tags.artwork_id = artworks.id").
				Where("artwork_tags.tag_id IN (?)", userTagIDs).
				Group("artworks.id").
				Order(gorm.Expr("CASE WHEN artworks.user_id != ? THEN 0 ELSE 1 END, COUNT(artwork_tags.tag_id) DESC, artworks.created_at DESC", userID)).
				Limit(limit).
				Find(&artworks).Error

			if err == nil && len(artworks) >= limit {
				r.populateCommentCounts(artworks)
				r.populateLikeCounts(artworks)
				r.populateUserLikeStatus(artworks, userID)
				return artworks, nil
			}
		}
	}

	// Backfill or Guest discovery
	var existingIDs []uint
	for _, a := range artworks {
		existingIDs = append(existingIDs, a.ID)
	}

	needed := limit - len(artworks)
	if needed <= 0 {
		r.populateCommentCounts(artworks)
		r.populateLikeCounts(artworks)
		r.populateUserLikeStatus(artworks, userID)
		return artworks, nil
	}

	var fallback []model.Artwork
	query := r.db.Model(&model.Artwork{}).
		Preload("Tags").
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, display_name, avatar_url, banner_url, is_verified, created_at")
		})

	if len(existingIDs) > 0 {
		query = query.Where("artworks.id NOT IN (?)", existingIDs)
	}

	err := query.Order("artworks.created_at DESC").
		Limit(needed).
		Find(&fallback).Error

	if err != nil {
		r.populateCommentCounts(artworks)
		r.populateLikeCounts(artworks)
		r.populateUserLikeStatus(artworks, userID)
		return artworks, err
	}

	artworks = append(artworks, fallback...)
	r.populateCommentCounts(artworks)
	r.populateLikeCounts(artworks)
	r.populateUserLikeStatus(artworks, userID)
	return artworks, nil
}

func (r *artworkRepository) populateCommentCounts(artworks []model.Artwork) {
	if len(artworks) == 0 {
		return
	}

	ids := make([]uint, len(artworks))
	for i, a := range artworks {
		ids[i] = a.ID
	}

	type countResult struct {
		ArtworkID uint  `gorm:"column:artwork_id"`
		Count     int64 `gorm:"column:count"`
	}

	var results []countResult
	if err := r.db.Model(&model.Comment{}).
		Select("artwork_id, COUNT(id) as count").
		Where("artwork_id IN (?)", ids).
		Group("artwork_id").
		Scan(&results).Error; err == nil {
		countMap := make(map[uint]int64, len(results))
		for _, res := range results {
			countMap[res.ArtworkID] = res.Count
		}
		for i := range artworks {
			artworks[i].CommentCount = countMap[artworks[i].ID]
		}
	}
}

func (r *artworkRepository) populateLikeCounts(artworks []model.Artwork) {
	if len(artworks) == 0 {
		return
	}

	ids := make([]uint, len(artworks))
	for i, a := range artworks {
		ids[i] = a.ID
	}

	type countResult struct {
		ArtworkID uint  `gorm:"column:artwork_id"`
		Count     int64 `gorm:"column:count"`
	}

	var results []countResult
	if err := r.db.Table("likes").
		Select("artwork_id, COUNT(id) as count").
		Where("artwork_id IN (?)", ids).
		Group("artwork_id").
		Scan(&results).Error; err == nil {
		countMap := make(map[uint]int64, len(results))
		for _, res := range results {
			countMap[res.ArtworkID] = res.Count
		}
		for i := range artworks {
			artworks[i].LikeCount = countMap[artworks[i].ID]
		}
	}
}

// populateUserLikeStatus batch-checks which artworks the given user has liked.
// Single IN-clause query instead of N+1 queries.
func (r *artworkRepository) populateUserLikeStatus(artworks []model.Artwork, userID uint) {
	if userID == 0 || len(artworks) == 0 {
		return
	}

	ids := make([]uint, len(artworks))
	for i, a := range artworks {
		ids[i] = a.ID
	}

	var likedIDs []uint
	if err := r.db.Table("likes").
		Select("artwork_id").
		Where("user_id = ? AND artwork_id IN (?)", userID, ids).
		Pluck("artwork_id", &likedIDs).Error; err == nil {
		likedSet := make(map[uint]bool, len(likedIDs))
		for _, lid := range likedIDs {
			likedSet[lid] = true
		}
		for i := range artworks {
			artworks[i].IsLiked = likedSet[artworks[i].ID]
		}
	}
}

func (r *artworkRepository) GetPopularTags(userID uint, limit int) ([]model.Tag, error) {
	var tags []model.Tag

	query := r.db.Table("tags").
		Select("tags.id, tags.name, tags.created_at, COUNT(artwork_tags.artwork_id) as usage_count").
		Joins("JOIN artwork_tags ON artwork_tags.tag_id = tags.id")

	if userID > 0 {
		query = query.Joins("JOIN artworks ON artworks.id = artwork_tags.artwork_id").
			Group("tags.id, tags.name, tags.created_at").
			Order(gorm.Expr("SUM(CASE WHEN artworks.user_id = ? THEN 1 ELSE 0 END) DESC, COUNT(artwork_tags.artwork_id) DESC, tags.name ASC", userID))
	} else {
		query = query.Group("tags.id, tags.name, tags.created_at").
			Order("COUNT(artwork_tags.artwork_id) DESC, tags.name ASC")
	}

	err := query.Limit(limit).Find(&tags).Error
	return tags, err
}

