package service

import (
	"errors"

	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/pkg/apperror"
	"github.com/sandi/lumiina/internal/repository"
	"gorm.io/gorm"
)

type FollowService interface {
	ToggleFollow(followerID uint, followingID uint) (isFollowing bool, followersCount int64, err error)
	GetFollowStatus(currentUserID uint, targetUserID uint) (*model.FollowStatusResponse, error)
	GetFollowers(currentUserID uint, targetUserID uint, page int, limit int) ([]model.FollowUserItem, int64, error)
	GetFollowing(currentUserID uint, targetUserID uint, page int, limit int) ([]model.FollowUserItem, int64, error)
}

type followService struct {
	repo repository.FollowRepository
}

func NewFollowService(repo repository.FollowRepository) FollowService {
	return &followService{repo: repo}
}

func (s *followService) ToggleFollow(followerID uint, followingID uint) (bool, int64, error) {
	if followerID == 0 {
		return false, 0, apperror.ErrUnauthorized
	}
	if followerID == followingID {
		return false, 0, apperror.New("BAD_REQUEST", "You cannot follow your own account", 400, repository.ErrCannotFollowSelf)
	}

	isFollowing, followersCount, err := s.repo.ToggleFollow(followerID, followingID)
	if err != nil {
		if errors.Is(err, repository.ErrCannotFollowSelf) {
			return false, 0, apperror.New("BAD_REQUEST", "You cannot follow your own account", 400, err)
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, 0, apperror.New("NOT_FOUND", "Target user does not exist", 404, err)
		}
		return false, 0, apperror.New("DATABASE_ERROR", "Failed to update follow relationship", 500, err)
	}

	return isFollowing, followersCount, nil
}

func (s *followService) GetFollowStatus(currentUserID uint, targetUserID uint) (*model.FollowStatusResponse, error) {
	if targetUserID == 0 {
		return nil, apperror.New("BAD_REQUEST", "Invalid target user ID", 400, nil)
	}

	followersCount, followingCount, err := s.repo.GetFollowCounts(targetUserID)
	if err != nil {
		return nil, apperror.New("DATABASE_ERROR", "Failed to retrieve follow counts", 500, err)
	}

	var isFollowing bool
	if currentUserID > 0 && currentUserID != targetUserID {
		isFollowing, _ = s.repo.IsFollowing(currentUserID, targetUserID)
	}

	return &model.FollowStatusResponse{
		IsFollowing:    isFollowing,
		FollowersCount: followersCount,
		FollowingCount: followingCount,
	}, nil
}

func (s *followService) GetFollowers(currentUserID uint, targetUserID uint, page int, limit int) ([]model.FollowUserItem, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 20
	}
	offset := (page - 1) * limit

	users, total, err := s.repo.GetFollowers(targetUserID, limit, offset)
	if err != nil {
		return nil, 0, apperror.New("DATABASE_ERROR", "Failed to retrieve followers", 500, err)
	}

	// If current user is authenticated, batch-check which of these followers the current user is following
	if currentUserID > 0 && len(users) > 0 {
		ids := make([]uint, len(users))
		for i, u := range users {
			ids[i] = u.ID
		}
		followedMap, _ := s.repo.BatchCheckFollowing(currentUserID, ids)
		for i := range users {
			users[i].IsFollowing = followedMap[users[i].ID]
		}
	}

	return users, total, nil
}

func (s *followService) GetFollowing(currentUserID uint, targetUserID uint, page int, limit int) ([]model.FollowUserItem, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 20
	}
	offset := (page - 1) * limit

	users, total, err := s.repo.GetFollowing(targetUserID, limit, offset)
	if err != nil {
		return nil, 0, apperror.New("DATABASE_ERROR", "Failed to retrieve following", 500, err)
	}

	// If current user is authenticated, batch-check which of these following users the current user is also following
	if currentUserID > 0 && len(users) > 0 {
		ids := make([]uint, len(users))
		for i, u := range users {
			ids[i] = u.ID
		}
		followedMap, _ := s.repo.BatchCheckFollowing(currentUserID, ids)
		for i := range users {
			users[i].IsFollowing = followedMap[users[i].ID]
		}
	}

	return users, total, nil
}
