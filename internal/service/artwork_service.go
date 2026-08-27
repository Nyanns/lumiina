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
	repo       *repository.ArtworkRepository
	cloudinary cloudinary.CloudinaryService
}

func NewArtworkService(repo *repository.ArtworkRepository, cld cloudinary.CloudinaryService) *ArtworkService {
	return &ArtworkService{repo: repo, cloudinary: cld}
}

func (s *ArtworkService) GetAllArtworks(limit int, offset int) ([]model.Artwork, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.GetAllArtworks(limit, offset)
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

func (s *ArtworkService) GetArtworkByID(id uint) (*model.Artwork, error) {
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
