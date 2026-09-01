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
	"golang.org/x/sync/singleflight"
)

type ArtworkHandler struct {
	service      *service.ArtworkService
	rdb          *redis.Client
	requestGroup singleflight.Group
}

func NewArtworkHandler(service *service.ArtworkService, rdb *redis.Client) *ArtworkHandler {
	return &ArtworkHandler{
		service: service,
		rdb:     rdb,
	}
}

// GetAllArtworks retrieves a paginated feed of artworks with search, tag filtering, and singleflight Redis caching.
// @Summary Get artwork feed & search
// @Description Fetches public anime fan art artworks with pagination, keyword search, tag filtering, and artist filtering.
// @Tags artworks
// @Produce json
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 20)"
// @Param search query string false "Search keyword matching title or description"
// @Param tag query string false "Filter by tag name"
// @Param user_id query int false "Filter by artist/creator user ID"
// @Success 200 {object} map[string]interface{} "Paginated list of artworks with total count"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /artworks [get]
func (h *ArtworkHandler) GetAllArtworks(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	pageStr := c.DefaultQuery("page", "1")
	search := c.Query("search")
	tag := c.Query("tag")
	userIDStr := c.Query("user_id")

	limit, _ := strconv.Atoi(limitStr)
	page, _ := strconv.Atoi(pageStr)
	userID, _ := strconv.Atoi(userIDStr)
	offset := (page - 1) * limit

	cacheKey := fmt.Sprintf("artworks:page:%d:limit:%d:s:%s:t:%s:u:%d", page, limit, search, tag, userID)
	ctx := context.Background()

	// Check cache
	cachedData, err := h.rdb.Get(ctx, cacheKey).Result()
	if err == nil {
		c.Data(http.StatusOK, "application/json", []byte(cachedData))
		return
	}

	// Singleflight: Collapses concurrent cache-miss queries to protect DB from cache stampede
	responseBytes, err, _ := h.requestGroup.Do(cacheKey, func() (interface{}, error) {
		artworks, total, err := h.service.GetAllArtworks(limit, offset, search, tag, uint(userID))
		if err != nil {
			return nil, err
		}

		response := gin.H{
			"message": "Successfully fetched artworks",
			"page":    page,
			"limit":   limit,
			"total":   total,
			"data":    artworks,
		}

		responseJSON, err := json.Marshal(response)
		if err != nil {
			return nil, err
		}

		h.rdb.Set(ctx, cacheKey, responseJSON, 1*time.Minute)
		return responseJSON, nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch artworks"})
		return
	}

	c.Data(http.StatusOK, "application/json", responseBytes.([]byte))
}

// CreateArtwork handles uploading new artwork image with tags to Cloudinary and database.
// @Summary Upload new artwork
// @Description Uploads fan art image (JPEG/PNG/WebP, max 20MB) with title, description, and tags.
// @Tags artworks
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param title formData string true "Artwork title"
// @Param description formData string false "Artwork description"
// @Param tags formData []string false "Artwork tags"
// @Param image formData file true "Artwork image file"
// @Success 201 {object} map[string]interface{} "Artwork created successfully"
// @Failure 400 {object} map[string]string "Invalid form data or unsupported file format"
// @Failure 401 {object} map[string]string "Unauthorized token"
// @Failure 500 {object} map[string]string "Image upload or database failure"
// @Router /artworks [post]
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

	h.invalidateArtworkCache(c.Request.Context())

	c.JSON(http.StatusCreated, gin.H{"message": "Artwork uploaded successfully", "data": artwork})
}

// GetArtworkByID fetches a single artwork by its numeric ID with author and tags.
// @Summary Get artwork details
// @Description Returns artwork metadata, author information, and associated tags.
// @Tags artworks
// @Produce json
// @Param id path int true "Artwork ID"
// @Success 200 {object} map[string]interface{} "Artwork details"
// @Failure 400 {object} map[string]string "Invalid artwork ID"
// @Failure 404 {object} map[string]string "Artwork not found"
// @Router /artworks/{id} [get]
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

// UpdateArtwork modifies an existing artwork's title and description.
// @Summary Update artwork
// @Description Updates artwork details. Only the artwork creator or an admin can update.
// @Tags artworks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Artwork ID"
// @Param req body map[string]string true "Updated title and description"
// @Success 200 {object} map[string]string "Artwork updated successfully"
// @Failure 400 {object} map[string]string "Invalid input"
// @Failure 403 {object} map[string]string "Forbidden: Not the owner"
// @Router /artworks/{id} [put]
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

	h.invalidateArtworkCache(c.Request.Context())

	c.JSON(http.StatusOK, gin.H{"message": "Artwork updated successfully"})
}

// DeleteArtwork removes an artwork from the database and CDN.
// @Summary Delete artwork
// @Description Deletes an artwork by ID. Only the creator or admin can perform deletion.
// @Tags artworks
// @Produce json
// @Security BearerAuth
// @Param id path int true "Artwork ID"
// @Success 200 {object} map[string]string "Artwork deleted successfully"
// @Failure 400 {object} map[string]string "Invalid ID"
// @Failure 403 {object} map[string]string "Forbidden: Unauthorized to delete"
// @Router /artworks/{id} [delete]
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

	h.invalidateArtworkCache(c.Request.Context())

	c.JSON(http.StatusOK, gin.H{"message": "Artwork deleted successfully"})
}

func (h *ArtworkHandler) invalidateArtworkCache(ctx context.Context) {
	iter := h.rdb.Scan(ctx, 0, "artworks:page:*", 0).Iterator()
	for iter.Next(ctx) {
		h.rdb.Del(ctx, iter.Val())
	}
}
