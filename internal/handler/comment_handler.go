package handler

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/service"
)

type CommentHandler struct {
	service service.CommentService
	rdb     *redis.Client
}

func NewCommentHandler(service service.CommentService, rdb *redis.Client) *CommentHandler {
	return &CommentHandler{service: service, rdb: rdb}
}

func (h *CommentHandler) invalidateArtworkCache() {
	if h.rdb == nil {
		return
	}
	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		patterns := []string{"artworks:page:*", "artworks:trending:*", "artworks:recommended:*"}
		for _, pattern := range patterns {
			var batchKeys []string
			iter := h.rdb.Scan(bgCtx, 0, pattern, 100).Iterator()
			for iter.Next(bgCtx) {
				batchKeys = append(batchKeys, iter.Val())
				if len(batchKeys) >= 100 {
					_ = h.rdb.Del(bgCtx, batchKeys...).Err()
					batchKeys = batchKeys[:0]
				}
			}
			if len(batchKeys) > 0 {
				_ = h.rdb.Del(bgCtx, batchKeys...).Err()
			}
		}
	}()
}

// CreateComment adds a sanitized comment to an artwork.
// @Summary Post a comment on artwork
// @Description Creates a new text comment for the specified artwork. Content is sanitized for HTML/XSS.
// @Tags comments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Artwork ID"
// @Param req body model.CreateCommentRequest true "Comment content"
// @Success 201 {object} map[string]interface{} "Comment created successfully"
// @Failure 400 {object} map[string]string "Invalid input or empty comment"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Artwork not found"
// @Router /artworks/{id}/comments [post]
func (h *CommentHandler) CreateComment(c *gin.Context) {
	artworkIDStr := c.Param("id")
	artworkID, err := strconv.Atoi(artworkIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artwork ID"})
		return
	}

	var req model.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDFloat, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := uint(userIDFloat.(float64))

	comment := &model.Comment{
		Content:   req.Content,
		ArtworkID: uint(artworkID),
		UserID:    userID,
	}

	if err := h.service.CreateComment(comment); err != nil {
		if strings.Contains(err.Error(), "violates foreign key") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Artwork not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to post comment: " + err.Error()})
		return
	}

	h.invalidateArtworkCache()

	c.JSON(http.StatusCreated, gin.H{
		"message": "Comment posted successfully",
		"data":    comment,
	})
}

// GetCommentsByArtwork returns paginated comments for an artwork.
// @Summary Get artwork comments
// @Description Fetches comments belonging to an artwork with pagination support.
// @Tags comments
// @Produce json
// @Param id path int true "Artwork ID"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 20, max: 50)"
// @Success 200 {object} map[string]interface{} "Paginated comments list"
// @Failure 400 {object} map[string]string "Invalid artwork ID"
// @Failure 500 {object} map[string]string "Database error"
// @Router /artworks/{id}/comments [get]
func (h *CommentHandler) GetCommentsByArtwork(c *gin.Context) {
	artworkIDStr := c.Param("id")
	artworkID, err := strconv.Atoi(artworkIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid artwork ID"})
		return
	}

	limitStr := c.DefaultQuery("limit", "20")
	pageStr := c.DefaultQuery("page", "1")

	limit, _ := strconv.Atoi(limitStr)
	page, _ := strconv.Atoi(pageStr)
	offset := (page - 1) * limit

	comments, total, err := h.service.GetCommentsByArtwork(uint(artworkID), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully fetched comments",
		"page":    page,
		"limit":   limit,
		"total":   total,
		"data":    comments,
	})
}

// DeleteComment deletes a comment by its ID.
// @Summary Delete a comment
// @Description Deletes a comment. Only the author or an admin can delete.
// @Tags comments
// @Produce json
// @Security BearerAuth
// @Param id path int true "Comment ID"
// @Success 200 {object} map[string]string "Comment deleted successfully"
// @Failure 400 {object} map[string]string "Invalid comment ID"
// @Failure 403 {object} map[string]string "Forbidden: Unauthorized to delete this comment"
// @Failure 404 {object} map[string]string "Comment not found"
// @Router /comments/{id} [delete]
func (h *CommentHandler) DeleteComment(c *gin.Context) {
	commentIDStr := c.Param("id")
	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	userIDFloat, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := uint(userIDFloat.(float64))
	role := c.GetString("role")

	if err := h.service.DeleteComment(uint(commentID), userID, role); err != nil {
		if err.Error() == "forbidden: unauthorized to delete this comment" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	h.invalidateArtworkCache()

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted successfully"})
}
