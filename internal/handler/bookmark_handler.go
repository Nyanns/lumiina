package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/sandi/lumiina/internal/pkg/cache"
	"github.com/sandi/lumiina/internal/pkg/hashid"
	"github.com/sandi/lumiina/internal/repository"
	"github.com/sandi/lumiina/internal/service"
)

type BookmarkHandler struct {
	bookmarkService service.BookmarkService
	userRepo        repository.UserRepository
	likeRepo        repository.LikeRepository
	rdb             *redis.Client
}

func NewBookmarkHandler(
	bookmarkService service.BookmarkService,
	userRepo repository.UserRepository,
	likeRepo repository.LikeRepository,
	rdb *redis.Client,
) *BookmarkHandler {
	return &BookmarkHandler{
		bookmarkService: bookmarkService,
		userRepo:        userRepo,
		likeRepo:        likeRepo,
		rdb:             rdb,
	}
}

// ToggleBookmark toggles the bookmark status of an artwork for the authenticated user
func (h *BookmarkHandler) ToggleBookmark(c *gin.Context) {
	artworkIDParam := c.Param("id")
	artworkID, err := hashid.Decode(artworkIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid artwork ID",
		})
		return
	}

	userID := extractCurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Authentication required",
		})
		return
	}

	isBookmarked, newCount, err := h.bookmarkService.ToggleBookmark(userID, artworkID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to update bookmark: " + err.Error(),
		})
		return
	}

	cache.InvalidateArtworkCache(h.rdb)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"artwork_id":     hashid.Encode(artworkID),
			"is_bookmarked":  isBookmarked,
			"bookmark_count": newCount,
		},
	})
}

// GetBookmarkStatus returns whether the caller bookmarked the artwork and the total bookmark count
func (h *BookmarkHandler) GetBookmarkStatus(c *gin.Context) {
	artworkIDParam := c.Param("id")
	artworkID, err := hashid.Decode(artworkIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid artwork ID",
		})
		return
	}

	userID := extractCurrentUserID(c)
	isBookmarked, _ := h.bookmarkService.IsUserBookmarked(userID, artworkID)
	count, _ := h.bookmarkService.GetBookmarkCount(artworkID)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"artwork_id":     hashid.Encode(artworkID),
			"is_bookmarked":  isBookmarked,
			"bookmark_count": count,
		},
	})
}

// GetUserBookmarks returns the artworks bookmarked by a user
func (h *BookmarkHandler) GetUserBookmarks(c *gin.Context) {
	userParam := c.Param("id")
	targetUser, err := h.userRepo.GetProfileByIdentifier(userParam)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "User not found",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}
	offset := (page - 1) * limit

	artworks, total, err := h.bookmarkService.GetUserBookmarks(targetUser.ID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to fetch bookmarks: " + err.Error(),
		})
		return
	}

	// Populate is_liked, is_bookmarked, like_count, bookmark_count for the caller
	callerID := extractCurrentUserID(c)
	if len(artworks) > 0 {
		artworkIDs := make([]uint, len(artworks))
		for i, a := range artworks {
			artworkIDs[i] = a.ID
		}

		var bookmarkedMap map[uint]bool
		if callerID > 0 {
			bookmarkedMap, _ = h.bookmarkService.BatchCheckBookmarked(callerID, artworkIDs)
		}

		for i := range artworks {
			artID := artworks[i].ID
			artworks[i].BookmarkCount, _ = h.bookmarkService.GetBookmarkCount(artID)
			if callerID > 0 && bookmarkedMap != nil {
				artworks[i].IsBookmarked = bookmarkedMap[artID]
			}
			if h.likeRepo != nil {
				artworks[i].LikeCount, _ = h.likeRepo.GetLikeCount(artID)
				if callerID > 0 {
					artworks[i].IsLiked, _ = h.likeRepo.IsUserLiked(callerID, artID)
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"page":   page,
		"limit":  limit,
		"total":  total,
		"data":   artworks,
	})
}
