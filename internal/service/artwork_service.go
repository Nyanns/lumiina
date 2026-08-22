package service

import (
	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/repository"
)

type ArtworkService struct {
	repo *repository.ArtworkRepository
}

func NewArtworkService(repo *repository.ArtworkRepository) *ArtworkService {
	return &ArtworkService{repo: repo}
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
