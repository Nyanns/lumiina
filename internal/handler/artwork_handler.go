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

	// 1. Buat Label/Kunci Unik Kulkas (Contoh: "artworks:page:1:limit:20")
	cacheKey := fmt.Sprintf("artworks:page:%d:limit:%d", page, limit)
	ctx := context.Background()

	// 2. CEK KULKAS (Redis) - Apakah data halaman ini sudah pernah dimasak?
	cachedData, err := h.rdb.Get(ctx, cacheKey).Result()
	if err == nil {
		// CACHE HIT! 🎉
		// Kulkas ada isinya! Langsung lempar "bungkusannya" ke tamu tanpa panggil Koki.
		c.Data(http.StatusOK, "application/json", []byte(cachedData))
		return
	}

	// 3. CACHE MISS! 😭
	// Kulkas kosong. Terpaksa kita panggil Koki (Service) buat masak dari Dapur (PostgreSQL).
	artworks, err := h.service.GetAllArtworks(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data dari server"})
		return
	}

	// 4. Siapkan piring dan tata makanannya (Bentuk JSON Response)
	response := gin.H{
		"message": "Sukses mengambil data karya seni",
		"page":    page,
		"limit":   limit,
		"data":    artworks,
	}

	// 5. Bungkus makanannya (Ubah Response tadi jadi JSON Mentah/String) biar bisa masuk Kulkas
	responseJSON, _ := json.Marshal(response)

	// 6. Taruh bungkusan ke Kulkas (Redis) dan pasang timer basi/kadaluarsa (1 Menit)
	h.rdb.Set(ctx, cacheKey, responseJSON, 1*time.Minute)

	// 7. Sajikan makanannya ke tamu pertama yang nungguin dari tadi
	c.JSON(http.StatusOK, response)
}

func (h *ArtworkHandler) CreateArtwork(c *gin.Context) {
	title := c.PostForm("title")
	description := c.PostForm("description")

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gambar wajib diunggah (field: image)"})
		return
	}

	// 1. Sesuaikan Ukuran File: Max 20MB (Ideal untuk resolusi 4K Jpg/Png di platform seni)
	if file.Size > 20*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ukuran gambar maksimal 20MB"})
		return
	}

	// 2. Keamanan Tingkat Lanjut: Pengecekan Magic Bytes (Mencegah Ekstensi Palsu)
	uploadedFile, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuka file"})
		return
	}
	defer uploadedFile.Close()

	buffer := make([]byte, 512) // Baca 512 byte pertama dari file
	if _, err := uploadedFile.Read(buffer); err != nil && err != io.EOF {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membaca isi file"})
		return
	}

	// Kembalikan cursor pembacaan file ke titik awal (byte 0) agar Cloudinary bisa membacanya secara utuh
	if _, err := uploadedFile.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses file"})
		return
	}

	// Deteksi tipe asli file berdasarkan isinya, bukan nama ekstensinya
	contentType := http.DetectContentType(buffer)
	if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/webp" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maling tertangkap! File yang dikirim BUKAN gambar asli (terdeteksi: " + contentType + ")"})
		return
	}

	userIDFloat, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID tidak ditemukan di token"})
		return
	}
	userID := uint(userIDFloat.(float64)) // JWT parsing angka sebagai float64

	// 3. Tangkap Input Tags (Kombinasi Array & String)
	rawTags := c.PostFormArray("tags")
	if len(rawTags) == 0 {
		rawTags = c.PostFormArray("tags[]")
	}
	if len(rawTags) == 0 {
		if tagsInput := c.PostForm("tags"); tagsInput != "" {
			rawTags = []string{tagsInput}
		}
	}

	// Pecah lagi dengan koma (berjaga-jaga jika user kirim "anime, fanart" dalam 1 baris)
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

	// Oper 'uploadedFile' (yang sudah kita reset cursornya) ke service, BUKAN fileHeader lagi
	err = h.service.CreateArtwork(c.Request.Context(), artwork, uploadedFile, finalTags)
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
