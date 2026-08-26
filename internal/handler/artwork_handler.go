package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/service"
)

type ArtworkHandler struct {
	service *service.ArtworkService
}

func NewArtworkHandler(service *service.ArtworkService) *ArtworkHandler {
	return &ArtworkHandler{service: service}
}

func (h *ArtworkHandler) GetAllArtworks(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	pageStr := c.DefaultQuery("page", "1")

	limit, _ := strconv.Atoi(limitStr)
	page, _ := strconv.Atoi(pageStr)

	offset := (page - 1) * limit

	artworks, err := h.service.GetAllArtworks(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data dari server"})
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sukses mengambil data karya seni",
		"page":    page,
		"limit":   limit,
		"data":    artworks,
	})
}

func (h *ArtworkHandler) CreateArtwork(c *gin.Context) {
	title := c.PostForm("title")
	description := c.PostForm("description")

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gambar wajib diunggah (field: image)"})
		return
	}

	userIDFloat, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID tidak ditemukan di token"})
		return
	}
	userID := uint(userIDFloat.(float64)) // JWT parsing angka sebagai float64

	artwork := &model.Artwork{
		Title:       title,
		Description: description,
		UserID:      userID,
	}

	err = h.service.CreateArtwork(c.Request.Context(), artwork, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengunggah gambar: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Karya berhasil diunggah", "data": artwork})
}

func (h *ArtworkHandler) GetArtworkByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	artwork, err := h.service.GetArtworkByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Karya tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": artwork})
}

func (h *ArtworkHandler) UpdateArtwork(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	// Tangkap data dari Body JSON
	var updateData struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ambil data User dari JWT
	userIDFloat, _ := c.Get("user_id")
	role, _ := c.Get("role")

	err = h.service.UpdateArtwork(uint(id), uint(userIDFloat.(float64)), role.(string), updateData.Title, updateData.Description)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()}) // Bisa Forbidden (bukan pemilik) atau Internal Server Error
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Karya berhasil diupdate"})
}

func (h *ArtworkHandler) DeleteArtwork(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	// Ambil data User dari JWT
	userIDFloat, _ := c.Get("user_id")
	role, _ := c.Get("role")

	err = h.service.DeleteArtwork(uint(id), uint(userIDFloat.(float64)), role.(string))
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Karya berhasil dihapus"})
}
