package handler

import (
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sandi/lumiina/internal/middleware"
	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/pkg/apperror"
	"github.com/sandi/lumiina/internal/pkg/sanitize"
	"github.com/sandi/lumiina/internal/repository"
	"github.com/sandi/lumiina/internal/service"
)

type UserHandler struct {
	service    service.UserService
	jwtSecret  string
	followRepo repository.FollowRepository
}

func NewUserHandler(service service.UserService, jwtSecret string, followRepo ...repository.FollowRepository) *UserHandler {
	h := &UserHandler{service: service, jwtSecret: jwtSecret}
	if len(followRepo) > 0 {
		h.followRepo = followRepo[0]
	}
	return h
}

// respondAppError writes standardized RFC 7807-inspired JSON error envelope with correlation ID
func respondAppError(c *gin.Context, appErr *apperror.AppError) {
	reqID := middleware.GetRequestID(c)
	c.JSON(appErr.Status, gin.H{
		"error": gin.H{
			"code":       appErr.Code,
			"message":    appErr.Message,
			"request_id": reqID,
		},
	})
}

// Register handles new user registration and dispatches email verification.
// @Summary Register a new user
// @Description Creates a new user account and returns a verification token.
// @Tags auth
// @Accept json
// @Produce json
// @Param req body model.RegisterRequest true "User Registration Data"
// @Success 201 {object} map[string]interface{}
// @Router /auth/register [post]
func (h *UserHandler) Register(c *gin.Context) {
	var req model.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		respondAppError(c, apperror.New("VALIDATION_ERROR", err.Error(), http.StatusBadRequest, err))
		return
	}

	if req.Password != req.ConfirmPassword {
		respondAppError(c, apperror.New("VALIDATION_ERROR", "Password confirmation does not match the entered password", http.StatusBadRequest, nil))
		return
	}

	user := model.User{
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
	}

	if err := h.service.Register(&user); err != nil {
		var appErr *apperror.AppError
		if errors.As(err, &appErr) {
			respondAppError(c, appErr)
			return
		}
		respondAppError(c, apperror.New("INTERNAL_ERROR", err.Error(), http.StatusInternalServerError, err))
		return
	}

	slog.Info("Security Audit: New user registered",
		"username", sanitize.Log(user.Username),
		"email", sanitize.Log(user.Email),
		"ip", sanitize.Log(c.ClientIP()),
		"request_id", middleware.GetRequestID(c),
	)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful! A verification link has been sent to your email address.",
	})
}

// Login authenticates a user and returns a signed JWT access token.
// @Summary Authenticate user
// @Description Logs in using email or username along with password, returning a JWT Bearer token.
// @Tags auth
// @Accept json
// @Produce json
// @Param req body model.LoginRequest true "User Credentials"
// @Success 200 {object} map[string]interface{} "Returns JWT Bearer token and user info"
// @Failure 400 {object} map[string]string "Invalid input payload"
// @Failure 401 {object} map[string]string "Invalid credentials or unverified account"
// @Router /auth/login [post]
func (h *UserHandler) Login(c *gin.Context) {
	var loginRequest model.LoginRequest

	if err := c.ShouldBindJSON(&loginRequest); err != nil {
		respondAppError(c, apperror.New("VALIDATION_ERROR", err.Error(), http.StatusBadRequest, err))
		return
	}

	user, err := h.service.Login(loginRequest.Identifier, loginRequest.Password)
	if err != nil {
		slog.Warn("Security Audit: Failed authentication attempt",
			"identifier", sanitize.Log(loginRequest.Identifier),
			"ip", sanitize.Log(c.ClientIP()),
			"request_id", middleware.GetRequestID(c),
		)
		var appErr *apperror.AppError
		if errors.As(err, &appErr) {
			respondAppError(c, appErr)
			return
		}
		respondAppError(c, apperror.ErrInvalidCredentials)
		return
	}

	slog.Info("Security Audit: User logged in successfully",
		"user_id", user.ID,
		"username", sanitize.Log(user.Username),
		"ip", sanitize.Log(c.ClientIP()),
		"request_id", middleware.GetRequestID(c),
	)

	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"iss":     "lumiina-api",
		"user_id": user.ID,
		"role":    user.Role,
		"iat":     now.Unix(),
		"nbf":     now.Unix(),
		"exp":     now.Add(time.Hour * 24).Unix(),
	})

	secret := h.jwtSecret

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	fullUser, errProfile := h.service.GetProfileByID(user.ID)
	if errProfile == nil && fullUser != nil {
		user = fullUser
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   tokenString,
		"user":    user,
	})
}

// VerifyEmail validates the email confirmation token and activates the account.
// @Summary Verify email address
// @Description Activates the user account using the single-use token sent via email.
// @Tags auth
// @Produce json,html
// @Param token query string true "Verification Token"
// @Success 200 {object} map[string]string "Account successfully activated"
// @Failure 400 {object} map[string]string "Missing, expired, or invalid token"
// @Router /auth/verify-email [get]
func (h *UserHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	wantsJSON := c.GetHeader("Accept") == "application/json"

	if token == "" {
		if wantsJSON {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Verification token is required"})
			return
		}
		c.Data(http.StatusBadRequest, "text/html; charset=utf-8", []byte(renderVerificationErrorPage("Token Not Found", "Verification link is incomplete or missing a valid token parameter.")))
		return
	}

	err := h.service.VerifyEmail(token)
	if err != nil {
		if wantsJSON {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.Data(http.StatusBadRequest, "text/html; charset=utf-8", []byte(renderVerificationErrorPage("Expired or Invalid Link", err.Error())))
		return
	}

	if wantsJSON {
		c.JSON(http.StatusOK, gin.H{
			"message": "Email successfully verified! Your account is now active. Please sign in.",
		})
		return
	}

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(renderVerificationSuccessPage()))
}

// ForgotPassword initiates the password reset workflow.
// @Summary Request password reset
// @Description Sends a 15-minute ephemeral password reset token to the given email address.
// @Tags auth
// @Accept json
// @Produce json
// @Param req body model.ForgotPasswordRequest true "Registered Email Address"
// @Success 200 {object} map[string]string "Generic success response to prevent account enumeration"
// @Failure 400 {object} map[string]string "Invalid email format"
// @Router /auth/forgot-password [post]
func (h *UserHandler) ForgotPassword(c *gin.Context) {
	var req model.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.ForgotPassword(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password reset request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "If the email address is registered, instructions to reset your password have been sent.",
	})
}

// ResetPassword updates the account password using the reset token.
// @Summary Reset account password
// @Description Sets a new password using a valid reset token.
// @Tags auth
// @Accept json
// @Produce json
// @Param req body model.ResetPasswordRequest true "Token and New Password"
// @Success 200 {object} map[string]string "Password reset successfully"
// @Failure 400 {object} map[string]string "Invalid token or password mismatch"
// @Router /auth/reset-password [post]
func (h *UserHandler) ResetPassword(c *gin.Context) {
	var req model.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.NewPassword != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "New password confirmation does not match"})
		return
	}

	err := h.service.ResetPassword(req.Token, req.NewPassword)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password successfully updated! Please sign in using your new password.",
	})
}

// GetMe returns the profile of the currently authenticated user.
// @Summary Get current user profile
// @Description Fetches details of the authenticated user from the JWT token.
// @Tags users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "User profile details"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "User not found"
// @Router /users/me [get]
func (h *UserHandler) GetMe(c *gin.Context) {
	userID := extractCurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := h.service.GetProfileByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User profile not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

// UpdateProfile updates the profile details of the authenticated user.
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := extractCurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req model.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.service.UpdateProfile(userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"data":    user,
	})
}

// UploadAvatar uploads and updates the authenticated user's avatar image.
func (h *UserHandler) UploadAvatar(c *gin.Context) {
	userID := extractCurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fileHeader, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Avatar image file is required"})
		return
	}

	if fileHeader.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Avatar file size exceeds 5MB limit"})
		return
	}

	uploadedFile, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}
	defer uploadedFile.Close()

	buffer := make([]byte, 512)
	if _, err := uploadedFile.Read(buffer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read file header"})
		return
	}
	if _, err := uploadedFile.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process file"})
		return
	}

	contentType := http.DetectContentType(buffer)
	if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/webp" && contentType != "image/gif" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file format. Only JPEG, PNG, WebP, and GIF are allowed"})
		return
	}

	avatarURL, err := h.service.UploadAvatar(c.Request.Context(), userID, uploadedFile)
	if err != nil {
		slog.Error("Avatar upload failed", "error", err, "user_id", userID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload avatar image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Avatar updated successfully",
		"avatar_url": avatarURL,
	})
}

// UploadBanner uploads and updates the authenticated user's banner image.
func (h *UserHandler) UploadBanner(c *gin.Context) {
	userID := extractCurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fileHeader, err := c.FormFile("banner")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Banner image file is required"})
		return
	}

	if fileHeader.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Banner file size exceeds 10MB limit"})
		return
	}

	uploadedFile, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}
	defer uploadedFile.Close()

	buffer := make([]byte, 512)
	if _, err := uploadedFile.Read(buffer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read file header"})
		return
	}
	if _, err := uploadedFile.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process file"})
		return
	}

	contentType := http.DetectContentType(buffer)
	if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/webp" && contentType != "image/gif" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file format. Only JPEG, PNG, WebP, and GIF are allowed"})
		return
	}

	bannerURL, err := h.service.UploadBanner(c.Request.Context(), userID, uploadedFile)
	if err != nil {
		slog.Error("Banner upload failed", "error", err, "user_id", userID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload banner image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Banner updated successfully",
		"banner_url": bannerURL,
	})
}

// SearchUsers searches for artists/users by username.
// @Summary Search users & artists
// @Description Search for community artists by username with pagination.
// @Tags users
// @Produce json
// @Param q query string false "Search keyword"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 20)"
// @Success 200 {object} map[string]interface{} "Paginated list of users"
// @Failure 500 {object} map[string]string "Database error"
// @Router /users/search [get]
func (h *UserHandler) SearchUsers(c *gin.Context) {
	q := c.Query("q")
	limitStr := c.DefaultQuery("limit", "20")
	pageStr := c.DefaultQuery("page", "1")

	limit, _ := strconv.Atoi(limitStr)
	page, _ := strconv.Atoi(pageStr)
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

	users, total, err := h.service.SearchUsers(q, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}

	callerID := extractCurrentUserID(c)
	if callerID > 0 && h.followRepo != nil && len(users) > 0 {
		userIDs := make([]uint, len(users))
		for i, u := range users {
			userIDs[i] = u.ID
		}
		followingMap, err := h.followRepo.BatchCheckFollowing(callerID, userIDs)
		if err == nil {
			for i := range users {
				users[i].IsFollowing = followingMap[users[i].ID]
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"page":  page,
		"limit": limit,
		"total": total,
		"data":  users,
	})
}

// GetUserProfile returns the public profile and artworks of a user by username or ID.
// @Summary Get public user profile
// @Description Fetches public artist profile and their uploaded artworks by username or ID.
// @Tags users
// @Produce json
// @Param id path string true "User username or ID"
// @Success 200 {object} map[string]interface{} "Public artist profile"
// @Failure 400 {object} map[string]string "Invalid user identifier"
// @Failure 404 {object} map[string]string "User not found"
// @Router /users/{id} [get]
func (h *UserHandler) GetUserProfile(c *gin.Context) {
	identifier := strings.TrimSpace(c.Param("id"))
	if identifier == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User identifier is required"})
		return
	}

	user, err := h.service.GetProfileByIdentifier(identifier)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User profile not found"})
		return
	}

	callerID := extractCurrentUserID(c)
	if callerID > 0 && h.followRepo != nil && callerID != user.ID {
		user.IsFollowing, _ = h.followRepo.IsFollowing(callerID, user.ID)
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

// Logout revokes the active JWT token in Redis.
// @Summary Logout user
// @Description Revokes the caller's JWT token, rendering it invalid for future requests.
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]string "Logged out successfully"
// @Failure 400 {object} map[string]string "Missing token"
// @Failure 500 {object} map[string]string "Revocation failure"
// @Router /auth/logout [post]
func (h *UserHandler) Logout(c *gin.Context) {
	rawToken, exists := c.Get("raw_token")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token not found in request context"})
		return
	}

	tokenStr, ok := rawToken.(string)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token context"})
		return
	}

	ttl := 24 * time.Hour
	if tokenExp, exists := c.Get("token_exp"); exists {
		if exp, ok := tokenExp.(int64); ok {
			if remaining := time.Until(time.Unix(exp, 0)); remaining > 0 {
				ttl = remaining
			}
		}
	}

	err := h.service.RevokeToken(c.Request.Context(), tokenStr, ttl)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to revoke token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logout successful. Your session has ended."})
}
