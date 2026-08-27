package repository

import (
	"github.com/sandi/lumiina/internal/model"
	"gorm.io/gorm"
)

type UserRepository interface {
	CreateUser(user *model.User) error
	FindByIdentifier(identifier string) (*model.User, error)
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
