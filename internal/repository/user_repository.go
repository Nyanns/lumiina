package repository

import (
	"strings"

	"github.com/sandi/lumiina/internal/model"
	"gorm.io/gorm"
)

type UserRepository interface {
	CreateUser(user *model.User) error
	FindByIdentifier(identifier string) (*model.User, error)
	FindByID(id uint) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	UpdateUser(user *model.User) error
	SearchUsers(query string, limit int, offset int) ([]model.User, int64, error)
	GetProfileByID(id uint) (*model.User, error)
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
	err := r.db.Where("email = ? OR username = ?", identifier, identifier).First(&user).Error
	return &user, err
}

func (r *userRepository) FindByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	return &user, err
}

func (r *userRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *userRepository) UpdateUser(user *model.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) SearchUsers(searchQuery string, limit int, offset int) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	dbQuery := r.db.Model(&model.User{})
	if searchQuery != "" {
		param := "%" + strings.ToLower(searchQuery) + "%"
		dbQuery = dbQuery.Where("LOWER(username) LIKE ?", param)
	}

	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := dbQuery.Select("id, username, role, is_verified, created_at").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&users).Error

	return users, total, err
}

func (r *userRepository) GetProfileByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.Select("id, username, role, is_verified, created_at").
		Preload("Artworks", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC").Limit(20)
		}).
		Preload("Artworks.Tags").
		First(&user, id).Error
	return &user, err
}
