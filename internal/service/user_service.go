package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/pkg/mailer"
	"github.com/sandi/lumiina/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Register(user *model.User) error
	Login(identifier, password string) (*model.User, error)
	VerifyEmail(token string) error
	ForgotPassword(email string) error
	ResetPassword(token, newPassword string) error
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
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.Password = string(hashedPassword)
	if user.Role == "" {
		user.Role = "regular"
	}
	user.IsVerified = false

	if err := s.repo.CreateUser(user); err != nil {
		return err
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
			if err != nil {
				log.Printf("[MAILER ERROR] Failed to send verification email to %s: %v\n", toEmail, err)
			} else {
				log.Printf("[MAILER SUCCESS] Verification email sent to %s\n", toEmail)
			}
		}(user.Email, user.Username, token, s.baseURL)
	}

	return nil
}

func (s *userService) Login(identifier, password string) (*model.User, error) {
	user, err := s.repo.FindByIdentifier(identifier)
	if err != nil {
		return nil, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, err
	}

	if !user.IsVerified {
		return nil, errors.New("akun belum diverifikasi. Silakan periksa inbox email Anda untuk tautan aktivasi")
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
	user, err := s.repo.FindByEmail(email)
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
			if err != nil {
				log.Printf("[MAILER ERROR] Failed to send reset password email to %s: %v\n", toEmail, err)
			} else {
				log.Printf("[MAILER SUCCESS] Reset password email sent to %s\n", toEmail)
			}
		}(user.Email, user.Username, token, s.baseURL)
	}

	return nil
}

func (s *userService) ResetPassword(token, newPassword string) error {
	if s.rdb == nil {
		return errors.New("redis client is not initialized")
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
	return nil
}
