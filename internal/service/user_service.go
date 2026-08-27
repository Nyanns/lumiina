package service

import (
	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Register(user *model.User) error
	Login(identifier, password string) (*model.User, error)
}

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo: repo}
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

	return s.repo.CreateUser(user)
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

	return user, nil
}
