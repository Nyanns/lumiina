package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
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
