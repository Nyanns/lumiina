package handler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/sandi/lumiina/internal/service"
)

type LikeHandler struct {
	service service.LikeService
	rdb     *redis.Client
}

func NewLikeHandler(service service.LikeService, rdb *redis.Client) *LikeHandler {
	return &LikeHandler{service: service, rdb: rdb}
}

func (h *LikeHandler) invalidateArtworkCache() {
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

// ToggleLike toggles the like status of an artwork for the authenticated user
func (h *LikeHandler) ToggleLike(c *gin.Context) {
	artworkIDParam := c.Param("id")
	artworkID, err := strconv.ParseUint(artworkIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid artwork ID",
		})
		return
	}

	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Authentication required",
		})
		return
	}

	var userID uint
	switch v := userIDVal.(type) {
	case float64:
		userID = uint(v)
	case uint:
		userID = v
	case int:
		userID = uint(v)
	case int64:
		userID = uint(v)
	default:
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Invalid user authentication context",
		})
		return
	}

	isLiked, newCount, err := h.service.ToggleLike(userID, uint(artworkID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to update like status: " + err.Error(),
		})
		return
	}

	h.invalidateArtworkCache()

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"artwork_id": artworkID,
			"is_liked":   isLiked,
			"like_count": newCount,
		},
	})
}
