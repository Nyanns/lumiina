package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"log/slog"
	"mime/multipart"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/pkg/apperror"
	"github.com/sandi/lumiina/internal/pkg/cloudinary"
	"github.com/sandi/lumiina/internal/pkg/mailer"
	"github.com/sandi/lumiina/internal/pkg/sanitize"
	"github.com/sandi/lumiina/internal/pkg/validator"
	"github.com/sandi/lumiina/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var dummyBcryptHash []byte

func init() {
	// Pre-compute a valid bcrypt hash during package init to eliminate timing variance on login
	dummyBcryptHash, _ = bcrypt.GenerateFromPassword([]byte("lumiina_anti_timing_attack_canary_secret_hash"), bcrypt.DefaultCost)
}

type UserService interface {
	Register(user *model.User) error
	Login(identifier, password string) (*model.User, error)
	VerifyEmail(token string) (*model.User, error)
	ResendVerificationEmail(email string) error
	ForgotPassword(email string) error
	ResetPassword(token, newPassword string) error
	SearchUsers(query string, limit int, offset int) ([]model.User, int64, error)
	GetProfileByID(id uint) (*model.User, error)
	GetProfileByIdentifier(identifier string) (*model.User, error)
	UpdateProfile(userID uint, req *model.UpdateProfileRequest) (*model.User, error)
	UploadAvatar(ctx context.Context, userID uint, file multipart.File) (string, error)
	UploadBanner(ctx context.Context, userID uint, file multipart.File) (string, error)
	RevokeToken(ctx context.Context, tokenString string, expiration time.Duration) error
	IsTokenRevoked(ctx context.Context, tokenString string) bool
	AdminDeleteUser(adminID, targetID uint) error
}

type userService struct {
	repo       repository.UserRepository
	rdb        *redis.Client
	mailer     mailer.MailerService
	baseURL    string
	cloudinary cloudinary.CloudinaryService
}

func NewUserService(repo repository.UserRepository, rdb *redis.Client, mailer mailer.MailerService, baseURL string, cld ...cloudinary.CloudinaryService) UserService {
	var cloudinaryService cloudinary.CloudinaryService
	if len(cld) > 0 {
		cloudinaryService = cld[0]
	}
	return &userService{
		repo:       repo,
		rdb:        rdb,
		mailer:     mailer,
		baseURL:    baseURL,
		cloudinary: cloudinaryService,
	}
}

func generateCryptoToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (s *userService) Register(user *model.User) error {
	user.Username = strings.TrimSpace(user.Username)
	user.Email = strings.ToLower(strings.TrimSpace(user.Email))

	// Enforce password strength complexity
	if err := validator.ValidatePasswordStrength(user.Password); err != nil {
		return apperror.New("AUTH_WEAK_PASSWORD", err.Error(), 400, err)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return apperror.New("INTERNAL_ERROR", "failed to process password", 500, err)
	}

	user.Password = string(hashedPassword)
	if user.Role == "" {
		user.Role = "regular"
	}
	user.IsVerified = false

	if err := s.repo.CreateUser(user); err != nil {
		return apperror.New("AUTH_USER_EXISTS", "username or email is already registered", 409, err)
	}

	// Generate 32-byte secure verification token
	token, err := generateCryptoToken(32)
	if err != nil {
		return nil // User created, email token error non-critical
	}

	ctx := context.Background()
	if s.rdb != nil {
		key := fmt.Sprintf("verify_email:%s", token)
		_ = s.rdb.Set(ctx, key, fmt.Sprintf("%d", user.ID), 24*time.Hour).Err()
	}

	// Dispatch verification email synchronously to ensure completion before serverless runtime freezes
	if s.mailer != nil {
		err := s.mailer.SendVerificationEmail(user.Email, user.Username, token, s.baseURL)
		cleanEmail := sanitize.Log(user.Email)
		if err != nil {
			slog.Error("Mailer: verification email dispatch failed", "email", cleanEmail, "error", err)
		} else {
			slog.Info("Mailer: verification email sent successfully", "email", cleanEmail)
		}
	}

	return nil
}

func (s *userService) Login(identifier, password string) (*model.User, error) {
	normalizedIdentifier := strings.TrimSpace(identifier)
	user, err := s.repo.FindByIdentifier(normalizedIdentifier)
	if err != nil {
		// Constant-time mitigation against timing attacks:
		// Always execute bcrypt comparison against precomputed hash even when user is not found.
		_ = bcrypt.CompareHashAndPassword(dummyBcryptHash, []byte(password))
		return nil, apperror.ErrInvalidCredentials
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, apperror.ErrInvalidCredentials
	}

	if !user.IsVerified {
		return nil, apperror.ErrUserUnverified
	}

	return user, nil
}

func (s *userService) VerifyEmail(token string) (*model.User, error) {
	if s.rdb == nil {
		return nil, errors.New("redis client is not initialized")
	}

	ctx := context.Background()
	key := fmt.Sprintf("verify_email:%s", token)
	consumedKey := fmt.Sprintf("verify_email:consumed:%s", token)

	userIDStr, err := s.rdb.Get(ctx, key).Result()
	if err != nil {
		// Graceful idempotency: Check if token was already consumed in a previous request or email scanner pre-fetch
		consumedUserIDStr, consumedErr := s.rdb.Get(ctx, consumedKey).Result()
		if consumedErr == nil && consumedUserIDStr != "" {
			if uid, parseErr := strconv.Atoi(consumedUserIDStr); parseErr == nil {
				user, findErr := s.repo.FindByID(uint(uid))
				if findErr == nil && user != nil {
					return user, nil
				}
			}
		}
		return nil, errors.New("verification link is invalid or expired")
	}

	userIDInt, err := strconv.Atoi(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user ID payload in token")
	}

	user, err := s.repo.FindByID(uint(userIDInt))
	if err != nil {
		return nil, errors.New("user not found")
	}

	user.IsVerified = true
	if err := s.repo.UpdateUser(user); err != nil {
		return nil, err
	}

	// Retain consumed token for 24 hours so repeat clicks or email pre-fetches
	// gracefully auto-login without showing scary "Expired or Invalid" errors
	_ = s.rdb.Set(ctx, consumedKey, fmt.Sprintf("%d", user.ID), 24*time.Hour).Err()
	_ = s.rdb.Del(ctx, key)
	return user, nil
}

func (s *userService) ResendVerificationEmail(email string) error {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	user, err := s.repo.FindByEmail(normalizedEmail)
	if err != nil || user == nil {
		// Anti-enumeration defense: return nil so existence of email is not leaked
		return nil
	}

	if user.IsVerified {
		// Already verified, do nothing
		return nil
	}

	ctx := context.Background()
	cooldownKey := fmt.Sprintf("resend_verify_cooldown:%d", user.ID)
	if s.rdb != nil {
		// Rate limiting: 60-second cooldown per account to prevent mail server abuse
		if exists, _ := s.rdb.Exists(ctx, cooldownKey).Result(); exists > 0 {
			return nil
		}
	}

	token, err := generateCryptoToken(32)
	if err != nil {
		return err
	}

	if s.rdb != nil {
		key := fmt.Sprintf("verify_email:%s", token)
		_ = s.rdb.Set(ctx, key, fmt.Sprintf("%d", user.ID), 24*time.Hour).Err()
		_ = s.rdb.Set(ctx, cooldownKey, "1", 60*time.Second).Err()
	}

	if s.mailer != nil {
		err := s.mailer.SendVerificationEmail(user.Email, user.Username, token, s.baseURL)
		cleanEmail := sanitize.Log(user.Email)
		if err != nil {
			slog.Error("Mailer: resend verification email dispatch failed", "email", cleanEmail, "error", err)
		} else {
			slog.Info("Mailer: resend verification email sent successfully", "email", cleanEmail)
		}
	}

	return nil
}

func (s *userService) ForgotPassword(email string) error {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	user, err := s.repo.FindByEmail(normalizedEmail)
	if err != nil {
		// Anti-enumeration defense: return nil so existence of email is not leaked
		return nil
	}

	token, err := generateCryptoToken(32)
	if err != nil {
		return err
	}

	ctx := context.Background()
	if s.rdb != nil {
		key := fmt.Sprintf("reset_password:%s", token)
		_ = s.rdb.Set(ctx, key, fmt.Sprintf("%d", user.ID), 15*time.Minute).Err()
	}

	// Dispatch reset password email synchronously to ensure completion before serverless runtime freezes
	if s.mailer != nil {
		err := s.mailer.SendPasswordResetEmail(user.Email, user.Username, token, s.baseURL)
		cleanEmail := sanitize.Log(user.Email)
		if err != nil {
			slog.Error("Mailer: password reset email dispatch failed", "email", cleanEmail, "error", err)
		} else {
			slog.Info("Mailer: password reset email sent successfully", "email", cleanEmail)
		}
	}

	return nil
}

func (s *userService) ResetPassword(token, newPassword string) error {
	if s.rdb == nil {
		return errors.New("redis client is not initialized")
	}

	// Enforce password strength complexity
	if err := validator.ValidatePasswordStrength(newPassword); err != nil {
		return apperror.New("AUTH_WEAK_PASSWORD", err.Error(), 400, err)
	}

	ctx := context.Background()
	key := fmt.Sprintf("reset_password:%s", token)

	userIDStr, err := s.rdb.Get(ctx, key).Result()
	if err != nil {
		return errors.New("password reset link is invalid or expired (valid for 15 minutes)")
	}

	userIDInt, err := strconv.Atoi(userIDStr)
	if err != nil {
		return errors.New("invalid user ID payload in token")
	}

	user, err := s.repo.FindByID(uint(userIDInt))
	if err != nil {
		return errors.New("user not found")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.Password = string(hashedPassword)
	if err := s.repo.UpdateUser(user); err != nil {
		return err
	}

	// Invalidate reset token upon successful consumption
	_ = s.rdb.Del(ctx, key)

	// Invalidate active sessions by setting user token revocation epoch
	userRevocationKey := fmt.Sprintf("user_revocation:%d", user.ID)
	_ = s.rdb.Set(ctx, userRevocationKey, time.Now().Unix(), 24*time.Hour).Err()

	return nil
}

func (s *userService) SearchUsers(query string, limit int, offset int) ([]model.User, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	query = strings.TrimSpace(query)
	return s.repo.SearchUsers(query, limit, offset)
}

func (s *userService) GetProfileByID(id uint) (*model.User, error) {
	return s.repo.GetProfileByID(id)
}

func (s *userService) GetProfileByIdentifier(identifier string) (*model.User, error) {
	return s.repo.GetProfileByIdentifier(identifier)
}

func (s *userService) UpdateProfile(userID uint, req *model.UpdateProfileRequest) (*model.User, error) {
	updates := map[string]interface{}{}

	// Defense in depth: Sanitize text fields to prevent stored XSS (CWE-079)
	updates["display_name"] = html.EscapeString(strings.TrimSpace(req.DisplayName))
	updates["bio"] = html.EscapeString(strings.TrimSpace(req.Bio))
	updates["location"] = html.EscapeString(strings.TrimSpace(req.Location))

	// Validate & neutralize dangerous website URIs (javascript:, data:, vbscript:)
	website := strings.TrimSpace(req.Website)
	if website != "" {
		lower := strings.ToLower(website)
		if strings.HasPrefix(lower, "javascript:") || strings.HasPrefix(lower, "data:") || strings.HasPrefix(lower, "vbscript:") {
			website = ""
		} else if !strings.HasPrefix(lower, "http://") && !strings.HasPrefix(lower, "https://") {
			website = "https://" + website
		}
		website = html.EscapeString(website)
	}
	updates["website"] = website

	// Validate social links JSON format
	if req.SocialLinks != "" {
		var js json.RawMessage
		if err := json.Unmarshal([]byte(req.SocialLinks), &js); err != nil {
			updates["social_links"] = "{}"
		} else {
			updates["social_links"] = req.SocialLinks
		}
	} else {
		updates["social_links"] = "{}"
	}

	if err := s.repo.UpdateProfileFields(userID, updates); err != nil {
		return nil, err
	}

	return s.repo.GetProfileByID(userID)
}

func (s *userService) UploadAvatar(ctx context.Context, userID uint, file multipart.File) (string, error) {
	if s.cloudinary == nil {
		return "", errors.New("cloudinary service is not configured")
	}

	url, err := s.cloudinary.UploadImage(ctx, file, "lumiina_avatars")
	if err != nil {
		return "", err
	}

	if err := s.repo.UpdateProfileFields(userID, map[string]interface{}{"avatar_url": url}); err != nil {
		return "", err
	}

	return url, nil
}

func (s *userService) UploadBanner(ctx context.Context, userID uint, file multipart.File) (string, error) {
	if s.cloudinary == nil {
		return "", errors.New("cloudinary service is not configured")
	}

	url, err := s.cloudinary.UploadImage(ctx, file, "lumiina_banners")
	if err != nil {
		return "", err
	}

	if err := s.repo.UpdateProfileFields(userID, map[string]interface{}{"banner_url": url}); err != nil {
		return "", err
	}

	return url, nil
}

func (s *userService) RevokeToken(ctx context.Context, tokenString string, expiration time.Duration) error {
	if s.rdb == nil {
		return nil
	}
	if expiration <= 0 {
		expiration = 24 * time.Hour
	}
	h := sha256.Sum256([]byte(tokenString))
	key := fmt.Sprintf("revoked_token:%x", h)
	return s.rdb.Set(ctx, key, "1", expiration).Err()
}

func (s *userService) IsTokenRevoked(ctx context.Context, tokenString string) bool {
	if s.rdb == nil {
		return false
	}
	h := sha256.Sum256([]byte(tokenString))
	key := fmt.Sprintf("revoked_token:%x", h)
	exists, err := s.rdb.Exists(ctx, key).Result()
	return err == nil && exists > 0
}

func (s *userService) AdminDeleteUser(adminID, targetID uint) error {
	if adminID == targetID {
		return apperror.New("FORBIDDEN", "Administrators cannot delete their own account", 403, nil)
	}

	targetUser, err := s.repo.FindByID(targetID)
	if err != nil {
		return apperror.New("NOT_FOUND", "User to delete not found", 404, err)
	}

	// Guardrail: Root admin safety
	if targetUser.Role == "admin" {
		return apperror.New("FORBIDDEN", "Cannot delete another administrator account", 403, nil)
	}

	if err := s.repo.DeleteUser(targetID); err != nil {
		return apperror.New("INTERNAL_SERVER_ERROR", "Failed to delete user", 500, err)
	}

	// Invalidate relevant caches in Redis
	if s.rdb != nil {
		ctx := context.Background()
		_ = s.rdb.Del(ctx,
			fmt.Sprintf("user_profile:%d", targetID),
			fmt.Sprintf("user_profile:%s", strings.ToLower(targetUser.Username)),
		).Err()
	}

	slog.Warn("Security Audit: User permanently deleted by admin",
		"admin_id", adminID,
		"target_user_id", targetID,
		"target_username", sanitize.Log(targetUser.Username),
	)

	return nil
}
