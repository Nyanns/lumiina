package service

import (
	"context"
	"errors"
	"mime/multipart"

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

func (s *ArtworkService) CreateArtwork(ctx context.Context, artwork *model.Artwork, fileHeader *multipart.FileHeader, tagNames []string) error {
	file, err := fileHeader.Open()
	if err != nil {
		return err
	}
	defer file.Close()

	// Upload ke Cloudinary
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

	// Authorization Check: Hanya pemilik atau Admin yang boleh update
	if artwork.UserID != userID && role != "admin" {
		return errors.New("akses ditolak: bukan pemilik karya")
	}

	artwork.Title = title
	artwork.Description = description

	return s.repo.Update(artwork)
}

func (s *ArtworkService) DeleteArtwork(id uint, userID uint, role string) error {
	artwork, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	// Authorization Check: Hanya pemilik atau Admin yang boleh hapus
	if artwork.UserID != userID && role != "admin" {
		return errors.New("akses ditolak: bukan pemilik karya")
	}

	// TODO: Hapus juga gambar di Cloudinary jika mau menghemat space (opsional)

	return s.repo.Delete(id)
}
