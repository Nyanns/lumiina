package service

import (
	"errors"
	"html"
	"strings"

	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/repository"
)

type CommentService interface {
	CreateComment(comment *model.Comment) error
	GetCommentsByArtwork(artworkID uint, limit int, offset int) ([]model.Comment, int64, error)
	DeleteComment(commentID uint, userID uint, role string) error
}

type commentService struct {
	repo repository.CommentRepository
}

func NewCommentService(repo repository.CommentRepository) CommentService {
	return &commentService{repo: repo}
}

func (s *commentService) CreateComment(comment *model.Comment) error {
	trimmed := strings.TrimSpace(comment.Content)
	if trimmed == "" {
		return errors.New("comment content cannot be empty")
	}

	// Defense in depth: Sanitize HTML markup to prevent Stored XSS
	comment.Content = html.EscapeString(trimmed)
	return s.repo.Create(comment)
}

func (s *commentService) GetCommentsByArtwork(artworkID uint, limit int, offset int) ([]model.Comment, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.GetByArtworkID(artworkID, limit, offset)
}

func (s *commentService) DeleteComment(commentID uint, userID uint, role string) error {
	comment, err := s.repo.GetByID(commentID)
	if err != nil {
		return err
	}

	// Authorization check: Only comment owner or admin can delete
	if comment.UserID != userID && role != "admin" {
		return errors.New("forbidden: unauthorized to delete this comment")
	}

	return s.repo.Delete(commentID)
}
