package repository

import (
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/pkg/hashid"
	"gorm.io/gorm"
)

type UserRepository interface {
	CreateUser(user *model.User) error
	FindByIdentifier(identifier string) (*model.User, error)
	FindByID(id uint) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	UpdateUser(user *model.User) error
	UpdateProfileFields(userID uint, updates map[string]interface{}) error
	SearchUsers(query string, limit int, offset int) ([]model.User, int64, error)
	GetProfileByID(id uint) (*model.User, error)
	GetProfileByIdentifier(identifier string) (*model.User, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) CreateUser(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) FindByIdentifier(identifier string) (*model.User, error) {
	var user model.User
	err := r.db.Where("LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)", identifier, identifier).First(&user).Error
	return &user, err
}

func (r *userRepository) FindByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	return &user, err
}

func (r *userRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("LOWER(email) = LOWER(?)", email).First(&user).Error
	return &user, err
}

func (r *userRepository) UpdateUser(user *model.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) UpdateProfileFields(userID uint, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return nil
	}

	// Build deterministic SET clause from sorted keys so SQL is predictable.
	// We use raw Exec here because GORM's .Updates(map) silently skips zero-value
	// strings (""), making it impossible to clear fields like display_name or bio.
	keys := make([]string, 0, len(updates))
	for k := range updates {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	setClauses := make([]string, 0, len(keys))
	args := make([]interface{}, 0, len(keys)+1)
	for i, k := range keys {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", k, i+1))
		args = append(args, updates[k])
	}
	args = append(args, userID)

	sql := fmt.Sprintf(
		"UPDATE users SET %s WHERE id = $%d",
		strings.Join(setClauses, ", "),
		len(keys)+1,
	)

	return r.db.Exec(sql, args...).Error
}

func (r *userRepository) SearchUsers(searchQuery string, limit int, offset int) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	dbQuery := r.db.Model(&model.User{})
	if searchQuery != "" {
		param := "%" + searchQuery + "%"
		dbQuery = dbQuery.Where("username ILIKE ?", param)
	}

	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := dbQuery.Select("id, username, role, is_verified, display_name, bio, avatar_url, banner_url, location, website, social_links, created_at").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&users).Error

	return users, total, err
}

func (r *userRepository) populateFollowCounts(user *model.User) {
	if user == nil || user.ID == 0 {
		return
	}
	_ = r.db.Table("follows").Where("following_id = ?", user.ID).Count(&user.FollowersCount)
	_ = r.db.Table("follows").Where("follower_id = ?", user.ID).Count(&user.FollowingCount)
}

func (r *userRepository) GetProfileByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.Select("id, username, role, is_verified, display_name, bio, avatar_url, banner_url, location, website, social_links, created_at").
		Preload("Artworks", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC").Limit(20)
		}).
		Preload("Artworks.Tags").
		First(&user, id).Error
	if err == nil {
		r.populateFollowCounts(&user)
	}
	return &user, err
}

func (r *userRepository) GetProfileByIdentifier(identifier string) (*model.User, error) {
	clean := strings.TrimPrefix(strings.TrimSpace(identifier), "@")
	if clean == "" {
		return nil, gorm.ErrRecordNotFound
	}

	query := r.db.Select("id, username, role, is_verified, display_name, bio, avatar_url, banner_url, location, website, social_links, created_at").
		Preload("Artworks", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC").Limit(20)
		}).
		Preload("Artworks.Tags")

	var user model.User

	// 1. If identifier is purely digits (e.g. legacy numeric URL /profile/1), resolve by ID directly
	if hashid.IsAllDigits(clean) {
		if num, err := strconv.ParseUint(clean, 10, 64); err == nil && num > 0 {
			if err := query.First(&user, uint(num)).Error; err == nil {
				r.populateFollowCounts(&user)
				return &user, nil
			}
		}
	}

	// 2. Primary lookup: Vanity username (case-insensitive, e.g. /profile/Nyanns or /profile/@Nyanns)
	if err := query.Where("LOWER(username) = LOWER(?)", clean).First(&user).Error; err == nil {
		r.populateFollowCounts(&user)
		return &user, nil
	}

	// 3. Fallback: Obfuscated HashID slug
	if decodedID, err := hashid.Decode(clean); err == nil && decodedID > 0 {
		if err := query.First(&user, decodedID).Error; err == nil {
			r.populateFollowCounts(&user)
			return &user, nil
		}
	}

	return nil, gorm.ErrRecordNotFound
}
