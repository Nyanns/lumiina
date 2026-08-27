package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/service"
)

type ArtworkHandler struct {
	service *service.ArtworkService
	rdb     *redis.Client
}

func NewArtworkHandler(service *service.ArtworkService, rdb *redis.Client) *ArtworkHandler {
	return &ArtworkHandler{
		service: service,
		rdb:     rdb}
}

func (h *ArtworkHandler) GetAllArtworks(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	pageStr := c.DefaultQuery("page", "1")

	limit, _ := strconv.Atoi(limitStr)
	page, _ := strconv.Atoi(pageStr)
	offset := (page - 1) * limit

	cacheKey := fmt.Sprintf("artworks:page:%d:limit:%d", page, limit)
	ctx := context.Background()

	// Check cache
	cachedData, err := h.rdb.Get(ctx, cacheKey).Result()
	if err == nil {
		c.Data(http.StatusOK, "application/json", []byte(cachedData))
		return
	}

	// Fetch from database on cache miss
	artworks, err := h.service.GetAllArtworks(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch artworks"})
		return
	}

	response := gin.H{
		"message": "Successfully fetched artworks",
		"page":    page,
		"limit":   limit,
		"data":    artworks,
	}

	responseJSON, _ := json.Marshal(response)
	h.rdb.Set(ctx, cacheKey, responseJSON, 1*time.Minute)

	c.JSON(http.StatusOK, response)
}

func (h *ArtworkHandler) CreateArtwork(c *gin.Context) {
	title := c.PostForm("title")
	description := c.PostForm("description")

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file is required (field: image)"})
		return
	}

	// Validate file size (max 20MB)
	if file.Size > 20*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image size exceeds 20MB limit"})
		return
	}

	// Validate file MIME type using magic bytes
	uploadedFile, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer uploadedFile.Close()

	buffer := make([]byte, 512)
	if _, err := uploadedFile.Read(buffer); err != nil && err != io.EOF {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	if _, err := uploadedFile.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process file"})
		return
	}

	contentType := http.DetectContentType(buffer)
	if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/webp" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file format. Only JPEG, PNG, and WebP are allowed"})
		return
	}

	userIDFloat, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user_id not found in token"})
		return
	}
	userID := uint(userIDFloat.(float64))

	// Parse tags
	rawTags := c.PostFormArray("tags")
	if len(rawTags) == 0 {
		rawTags = c.PostFormArray("tags[]")
	}
	if len(rawTags) == 0 {
		if tagsInput := c.PostForm("tags"); tagsInput != "" {
			rawTags = []string{tagsInput}
		}
	}

	var finalTags []string
	for _, t := range rawTags {
		parts := strings.Split(t, ",")
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" {
				finalTags = append(finalTags, p)
			}
		}
	}

	artwork := &model.Artwork{
		Title:       title,
		Description: description,
		UserID:      userID,
	}

	err = h.service.CreateArtwork(c.Request.Context(), artwork, uploadedFile, finalTags)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Artwork uploaded successfully", "data": artwork})
}

func (h *ArtworkHandler) GetArtworkByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	artwork, err := h.service.GetArtworkByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Artwork not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": artwork})
}

func (h *ArtworkHandler) UpdateArtwork(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var updateData struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDFloat, _ := c.Get("user_id")
	role, _ := c.Get("role")

	err = h.service.UpdateArtwork(uint(id), uint(userIDFloat.(float64)), role.(string), updateData.Title, updateData.Description)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Artwork updated successfully"})
}

func (h *ArtworkHandler) DeleteArtwork(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	userIDFloat, _ := c.Get("user_id")
	role, _ := c.Get("role")

	err = h.service.DeleteArtwork(uint(id), uint(userIDFloat.(float64)), role.(string))
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Artwork deleted successfully"})
}
