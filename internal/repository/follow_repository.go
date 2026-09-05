package repository

import (
	"errors"

	"github.com/sandi/lumiina/internal/model"
	"gorm.io/gorm"
)

var ErrCannotFollowSelf = errors.New("users cannot follow themselves")

type FollowRepository interface {
	ToggleFollow(followerID uint, followingID uint) (isFollowing bool, followersCount int64, err error)
	IsFollowing(followerID uint, followingID uint) (bool, error)
	GetFollowCounts(userID uint) (followersCount int64, followingCount int64, err error)
	GetFollowers(userID uint, limit int, offset int) ([]model.FollowUserItem, int64, error)
	GetFollowing(userID uint, limit int, offset int) ([]model.FollowUserItem, int64, error)
	BatchCheckFollowing(followerID uint, targetUserIDs []uint) (map[uint]bool, error)
}

type followRepository struct {
	db *gorm.DB
}

func NewFollowRepository(db *gorm.DB) FollowRepository {
	return &followRepository{db: db}
}

func (r *followRepository) ToggleFollow(followerID uint, followingID uint) (bool, int64, error) {
	if followerID == followingID {
		return false, 0, ErrCannotFollowSelf
	}

	var isFollowing bool
	var newFollowersCount int64

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Verify target following user exists
		var targetUser model.User
		if err := tx.Select("id").First(&targetUser, followingID).Error; err != nil {
			return err
		}

		// 2. Check existing relationship
		var existing model.Follow
		err := tx.Where("follower_id = ? AND following_id = ?", followerID, followingID).First(&existing).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// Create follow relationship
				newFollow := model.Follow{
					FollowerID:  followerID,
					FollowingID: followingID,
				}
				if err := tx.Create(&newFollow).Error; err != nil {
					return err
				}
				isFollowing = true
			} else {
				return err
			}
		} else {
			// Unfollow (delete relationship)
			if err := tx.Delete(&existing).Error; err != nil {
				return err
			}
			isFollowing = false
		}

		// 3. Count total followers for the target following user
		if err := tx.Model(&model.Follow{}).Where("following_id = ?", followingID).Count(&newFollowersCount).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return false, 0, err
	}

	return isFollowing, newFollowersCount, nil
}

func (r *followRepository) IsFollowing(followerID uint, followingID uint) (bool, error) {
	if followerID == 0 || followingID == 0 || followerID == followingID {
		return false, nil
	}

	var count int64
	err := r.db.Model(&model.Follow{}).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Count(&count).Error
	return count > 0, err
}

func (r *followRepository) GetFollowCounts(userID uint) (int64, int64, error) {
	var followersCount int64
	var followingCount int64

	if err := r.db.Model(&model.Follow{}).Where("following_id = ?", userID).Count(&followersCount).Error; err != nil {
		return 0, 0, err
	}

	if err := r.db.Model(&model.Follow{}).Where("follower_id = ?", userID).Count(&followingCount).Error; err != nil {
		return 0, 0, err
	}

	return followersCount, followingCount, nil
}

func (r *followRepository) GetFollowers(userID uint, limit int, offset int) ([]model.FollowUserItem, int64, error) {
	var total int64
	if err := r.db.Model(&model.Follow{}).Where("following_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var users []model.FollowUserItem
	err := r.db.Table("users").
		Select("users.id, users.username, users.display_name, users.avatar_url, users.bio").
		Joins("INNER JOIN follows ON users.id = follows.follower_id").
		Where("follows.following_id = ?", userID).
		Order("follows.created_at DESC").
		Limit(limit).Offset(offset).
		Scan(&users).Error

	return users, total, err
}

func (r *followRepository) GetFollowing(userID uint, limit int, offset int) ([]model.FollowUserItem, int64, error) {
	var total int64
	if err := r.db.Model(&model.Follow{}).Where("follower_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var users []model.FollowUserItem
	err := r.db.Table("users").
		Select("users.id, users.username, users.display_name, users.avatar_url, users.bio").
		Joins("INNER JOIN follows ON users.id = follows.following_id").
		Where("follows.follower_id = ?", userID).
		Order("follows.created_at DESC").
		Limit(limit).Offset(offset).
		Scan(&users).Error

	return users, total, err
}

func (r *followRepository) BatchCheckFollowing(followerID uint, targetUserIDs []uint) (map[uint]bool, error) {
	result := make(map[uint]bool, len(targetUserIDs))
	if followerID == 0 || len(targetUserIDs) == 0 {
		return result, nil
	}

	var followedIDs []uint
	err := r.db.Model(&model.Follow{}).
		Where("follower_id = ? AND following_id IN ?", followerID, targetUserIDs).
		Pluck("following_id", &followedIDs).Error
	if err != nil {
		return nil, err
	}

	for _, fid := range followedIDs {
		result[fid] = true
	}
	return result, nil
}
