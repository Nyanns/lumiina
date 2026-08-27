package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/service"
)

type CommentHandler struct {
	service service.CommentService
}

func NewCommentHandler(service service.CommentService) *CommentHandler {
	return &CommentHandler{service: service}
}

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

	c.JSON(http.StatusCreated, gin.H{
		"message": "Comment posted successfully",
		"data":    comment,
	})
}

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

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted successfully"})
}
