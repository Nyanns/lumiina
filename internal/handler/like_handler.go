package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/sandi/lumiina/internal/pkg/cache"
	"github.com/sandi/lumiina/internal/pkg/hashid"
	"github.com/sandi/lumiina/internal/service"
)

type LikeHandler struct {
	service service.LikeService
	rdb     *redis.Client
}

func NewLikeHandler(service service.LikeService, rdb *redis.Client) *LikeHandler {
	return &LikeHandler{service: service, rdb: rdb}
}



// ToggleLike toggles the like status of an artwork for the authenticated user
func (h *LikeHandler) ToggleLike(c *gin.Context) {
	artworkIDParam := c.Param("id")
	artworkID, err := hashid.Decode(artworkIDParam)
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

	cache.InvalidateArtworkCache(h.rdb)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"artwork_id": hashid.Encode(artworkID),
			"is_liked":   isLiked,
			"like_count": newCount,
		},
	})
}
