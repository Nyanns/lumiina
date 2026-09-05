package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sandi/lumiina/internal/repository"
	"github.com/sandi/lumiina/internal/service"
)

type FollowHandler struct {
	followService service.FollowService
	userRepo      repository.UserRepository
}

func NewFollowHandler(followService service.FollowService, userRepo repository.UserRepository) *FollowHandler {
	return &FollowHandler{
		followService: followService,
		userRepo:      userRepo,
	}
}

// resolveTargetUserID resolves target ID from numeric string, vanity handle, or HashID
func (h *FollowHandler) resolveTargetUserID(param string) (uint, error) {
	user, err := h.userRepo.GetProfileByIdentifier(param)
	if err != nil {
		return 0, err
	}
	return user.ID, nil
}

// ToggleFollow toggles following of target user for the authenticated user
func (h *FollowHandler) ToggleFollow(c *gin.Context) {
	currentUserID := extractCurrentUserID(c)
	if currentUserID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Authentication required",
		})
		return
	}

	targetParam := c.Param("id")
	targetUserID, err := h.resolveTargetUserID(targetParam)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Target user not found",
		})
		return
	}

	isFollowing, followersCount, err := h.followService.ToggleFollow(currentUserID, targetUserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"is_following":    isFollowing,
			"followers_count": followersCount,
		},
	})
}

// GetFollowStatus returns relationship status between current user and target user
func (h *FollowHandler) GetFollowStatus(c *gin.Context) {
	currentUserID := extractCurrentUserID(c) // May be 0 if guest

	targetParam := c.Param("id")
	targetUserID, err := h.resolveTargetUserID(targetParam)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Target user not found",
		})
		return
	}

	status, err := h.followService.GetFollowStatus(currentUserID, targetUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   status,
	})
}

// GetFollowers returns paginated list of users following target user
func (h *FollowHandler) GetFollowers(c *gin.Context) {
	currentUserID := extractCurrentUserID(c)

	targetParam := c.Param("id")
	targetUserID, err := h.resolveTargetUserID(targetParam)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Target user not found",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	users, total, err := h.followService.GetFollowers(currentUserID, targetUserID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"users": users,
			"pagination": gin.H{
				"page":  page,
				"limit": limit,
				"total": total,
			},
		},
	})
}

// GetFollowing returns paginated list of users followed by target user
func (h *FollowHandler) GetFollowing(c *gin.Context) {
	currentUserID := extractCurrentUserID(c)

	targetParam := c.Param("id")
	targetUserID, err := h.resolveTargetUserID(targetParam)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Target user not found",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	users, total, err := h.followService.GetFollowing(currentUserID, targetUserID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"users": users,
			"pagination": gin.H{
				"page":  page,
				"limit": limit,
				"total": total,
			},
		},
	})
}
