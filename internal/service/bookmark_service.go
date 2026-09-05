package service

import (
	"errors"

	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/repository"
)

type BookmarkService interface {
	ToggleBookmark(userID uint, artworkID uint) (isBookmarked bool, newCount int64, err error)
	GetBookmarkCount(artworkID uint) (int64, error)
	IsUserBookmarked(userID uint, artworkID uint) (bool, error)
	GetUserBookmarks(userID uint, limit int, offset int) ([]model.Artwork, int64, error)
	BatchCheckBookmarked(userID uint, artworkIDs []uint) (map[uint]bool, error)
}

type bookmarkService struct {
	bookmarkRepo repository.BookmarkRepository
}

func NewBookmarkService(bookmarkRepo repository.BookmarkRepository) BookmarkService {
	return &bookmarkService{bookmarkRepo: bookmarkRepo}
}

func (s *bookmarkService) ToggleBookmark(userID uint, artworkID uint) (bool, int64, error) {
	if userID == 0 {
		return false, 0, errors.New("unauthorized: user must be logged in to bookmark")
	}
	if artworkID == 0 {
		return false, 0, errors.New("invalid artwork ID")
	}
	return s.bookmarkRepo.ToggleBookmark(userID, artworkID)
}

func (s *bookmarkService) GetBookmarkCount(artworkID uint) (int64, error) {
	if artworkID == 0 {
		return 0, errors.New("invalid artwork ID")
	}
	return s.bookmarkRepo.GetBookmarkCount(artworkID)
}

func (s *bookmarkService) IsUserBookmarked(userID uint, artworkID uint) (bool, error) {
	if artworkID == 0 {
		return false, errors.New("invalid artwork ID")
	}
	return s.bookmarkRepo.IsUserBookmarked(userID, artworkID)
}

func (s *bookmarkService) GetUserBookmarks(userID uint, limit int, offset int) ([]model.Artwork, int64, error) {
	if userID == 0 {
		return nil, 0, errors.New("invalid user ID")
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	return s.bookmarkRepo.GetUserBookmarks(userID, limit, offset)
}

func (s *bookmarkService) BatchCheckBookmarked(userID uint, artworkIDs []uint) (map[uint]bool, error) {
	return s.bookmarkRepo.BatchCheckBookmarked(userID, artworkIDs)
}
