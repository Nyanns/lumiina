package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/pkg/apperror"
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
	VerifyEmail(token string) error
	ForgotPassword(email string) error
	ResetPassword(token, newPassword string) error
	SearchUsers(query string, limit int, offset int) ([]model.User, int64, error)
	GetProfileByID(id uint) (*model.User, error)
	RevokeToken(ctx context.Context, tokenString string, expiration time.Duration) error
	IsTokenRevoked(ctx context.Context, tokenString string) bool
}

type userService struct {
	repo    repository.UserRepository
	rdb     *redis.Client
	mailer  mailer.MailerService
	baseURL string
}

func NewUserService(repo repository.UserRepository, rdb *redis.Client, mailer mailer.MailerService, baseURL string) UserService {
	return &userService{
		repo:    repo,
		rdb:     rdb,
		mailer:  mailer,
		baseURL: baseURL,
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
		return apperror.New("INTERNAL_ERROR", "gagal memproses kata sandi", 500, err)
	}

	user.Password = string(hashedPassword)
	if user.Role == "" {
		user.Role = "regular"
	}
	user.IsVerified = false

	if err := s.repo.CreateUser(user); err != nil {
		return apperror.New("AUTH_USER_EXISTS", "username atau email sudah terdaftar", 409, err)
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

	// Dispatch verification email asynchronously in background
	if s.mailer != nil {
		go func(toEmail, username, verToken, baseURL string) {
			err := s.mailer.SendVerificationEmail(toEmail, username, verToken, baseURL)
			cleanEmail := sanitize.Log(toEmail)
			if err != nil {
				log.Printf("[MAILER ERROR] Failed to send verification email to %s: %v\n", cleanEmail, err)
			} else {
				log.Printf("[MAILER SUCCESS] Verification email sent to %s\n", cleanEmail)
			}
		}(user.Email, user.Username, token, s.baseURL)
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

func (s *userService) VerifyEmail(token string) error {
	if s.rdb == nil {
		return errors.New("redis client is not initialized")
	}

	ctx := context.Background()
	key := fmt.Sprintf("verify_email:%s", token)

	userIDStr, err := s.rdb.Get(ctx, key).Result()
	if err != nil {
		return errors.New("tautan verifikasi tidak valid atau sudah kedaluwarsa")
	}

	userIDInt, err := strconv.Atoi(userIDStr)
	if err != nil {
		return errors.New("invalid user ID payload in token")
	}

	user, err := s.repo.FindByID(uint(userIDInt))
	if err != nil {
		return errors.New("pengguna tidak ditemukan")
	}

	user.IsVerified = true
	if err := s.repo.UpdateUser(user); err != nil {
		return err
	}

	// Invalidate token upon successful consumption (single-use constraint)
	_ = s.rdb.Del(ctx, key)
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

	// Dispatch reset password email asynchronously in background
	if s.mailer != nil {
		go func(toEmail, username, resetToken, baseURL string) {
			err := s.mailer.SendPasswordResetEmail(toEmail, username, resetToken, baseURL)
			cleanEmail := sanitize.Log(toEmail)
			if err != nil {
				log.Printf("[MAILER ERROR] Failed to send reset password email to %s: %v\n", cleanEmail, err)
			} else {
				log.Printf("[MAILER SUCCESS] Reset password email sent to %s\n", cleanEmail)
			}
		}(user.Email, user.Username, token, s.baseURL)
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
		return errors.New("tautan reset password tidak valid atau sudah kedaluwarsa (berlaku 15 menit)")
	}

	userIDInt, err := strconv.Atoi(userIDStr)
	if err != nil {
		return errors.New("invalid user ID payload in token")
	}

	user, err := s.repo.FindByID(uint(userIDInt))
	if err != nil {
		return errors.New("pengguna tidak ditemukan")
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

func (s *userService) RevokeToken(ctx context.Context, tokenString string, expiration time.Duration) error {
	if s.rdb == nil {
		return nil
	}
	if expiration <= 0 {
		expiration = 24 * time.Hour
	}
	key := fmt.Sprintf("revoked_token:%s", tokenString)
	return s.rdb.Set(ctx, key, "1", expiration).Err()
}

func (s *userService) IsTokenRevoked(ctx context.Context, tokenString string) bool {
	if s.rdb == nil {
		return false
	}
	key := fmt.Sprintf("revoked_token:%s", tokenString)
	exists, err := s.rdb.Exists(ctx, key).Result()
	return err == nil && exists > 0
}
