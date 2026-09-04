package service

import (
	"errors"

	"github.com/sandi/lumiina/internal/repository"
)

type LikeService interface {
	ToggleLike(userID uint, artworkID uint) (isLiked bool, newCount int64, err error)
	GetLikeCount(artworkID uint) (int64, error)
	IsUserLiked(userID uint, artworkID uint) (bool, error)
}

type likeService struct {
	likeRepo repository.LikeRepository
}

func NewLikeService(likeRepo repository.LikeRepository) LikeService {
	return &likeService{likeRepo: likeRepo}
}

func (s *likeService) ToggleLike(userID uint, artworkID uint) (bool, int64, error) {
	if userID == 0 {
		return false, 0, errors.New("unauthorized: user must be logged in to like")
	}
	if artworkID == 0 {
		return false, 0, errors.New("invalid artwork ID")
	}
	return s.likeRepo.ToggleLike(userID, artworkID)
}

func (s *likeService) GetLikeCount(artworkID uint) (int64, error) {
	if artworkID == 0 {
		return 0, errors.New("invalid artwork ID")
	}
	return s.likeRepo.GetLikeCount(artworkID)
}

func (s *likeService) IsUserLiked(userID uint, artworkID uint) (bool, error) {
	if artworkID == 0 {
		return false, errors.New("invalid artwork ID")
	}
	return s.likeRepo.IsUserLiked(userID, artworkID)
}
