package service

import (
	"context"
	"errors"
	"html"
	"mime/multipart"
	"strings"

	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/pkg/cloudinary"
	"github.com/sandi/lumiina/internal/repository"
)

type ArtworkService struct {
	repo       repository.ArtworkRepository
	cloudinary cloudinary.CloudinaryService
}

func NewArtworkService(repo repository.ArtworkRepository, cld cloudinary.CloudinaryService) *ArtworkService {
	return &ArtworkService{repo: repo, cloudinary: cld}
}

func (s *ArtworkService) GetAllArtworks(limit int, offset int, search string, tag string, userID uint, currentUserID uint) ([]model.Artwork, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	search = strings.TrimSpace(search)
	tag = strings.TrimSpace(tag)
	return s.repo.GetAllArtworks(limit, offset, search, tag, userID, currentUserID)
}

func (s *ArtworkService) CreateArtwork(ctx context.Context, artwork *model.Artwork, file multipart.File, tagNames []string) error {
	artwork.Title = html.EscapeString(strings.TrimSpace(artwork.Title))
	artwork.Description = html.EscapeString(strings.TrimSpace(artwork.Description))

	imageURL, err := s.cloudinary.UploadImage(ctx, file, "lumiina_artworks")
	if err != nil {
		return err
	}

	artwork.ImageURL = imageURL
	return s.repo.Create(artwork, tagNames)
}

func (s *ArtworkService) GetArtworkByID(id uint, currentUserID ...uint) (*model.Artwork, error) {
	var uid uint
	if len(currentUserID) > 0 {
		uid = currentUserID[0]
	}
	if uid > 0 {
		return s.repo.GetByIDForUser(id, uid)
	}
	return s.repo.GetByID(id)
}

func (s *ArtworkService) UpdateArtwork(id uint, userID uint, role string, title, description string) error {
	artwork, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	if artwork.UserID != userID && role != "admin" {
		return errors.New("forbidden: unauthorized to update this artwork")
	}

	artwork.Title = html.EscapeString(strings.TrimSpace(title))
	artwork.Description = html.EscapeString(strings.TrimSpace(description))

	return s.repo.Update(artwork)
}

func (s *ArtworkService) DeleteArtwork(id uint, userID uint, role string) error {
	artwork, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	if artwork.UserID != userID && role != "admin" {
		return errors.New("forbidden: unauthorized to delete this artwork")
	}

	return s.repo.Delete(id)
}

func (s *ArtworkService) GetTrendingArtworks(limit int, currentUserID uint) ([]model.Artwork, error) {
	if limit <= 0 || limit > 30 {
		limit = 10
	}
	return s.repo.GetTrendingArtworks(limit, currentUserID)
}

func (s *ArtworkService) GetRecommendedArtworks(userID uint, limit int) ([]model.Artwork, error) {
	if limit <= 0 || limit > 30 {
		limit = 10
	}
	return s.repo.GetRecommendedArtworks(userID, limit)
}

func (s *ArtworkService) GetPopularTags(userID uint, limit int) ([]model.Tag, error) {
	if limit <= 0 || limit > 30 {
		limit = 15
	}
	return s.repo.GetPopularTags(userID, limit)
}

