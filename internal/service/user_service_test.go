package service

import (
	"testing"

	"github.com/sandi/lumiina/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserRepository is a mock implementation of repository.UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) CreateUser(user *model.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) FindByIdentifier(identifier string) (*model.User, error) {
	args := m.Called(identifier)
	if args.Get(0) != nil {
		return args.Get(0).(*model.User), args.Error(1)
	}
	return nil, args.Error(1)
}

func TestRegister_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	userService := NewUserService(mockRepo)

	dummyUser := &model.User{
		Username: "sandi",
		Email:    "sandi@htb.com",
		Password: "passwordrahasia",
	}

	mockRepo.On("CreateUser", mock.Anything).Return(nil)

	// Act
	err := userService.Register(dummyUser)

	// Assert
	assert.NoError(t, err)
	assert.NotEqual(t, "passwordrahasia", dummyUser.Password)
	assert.NotEmpty(t, dummyUser.Password)
	assert.Equal(t, "regular", dummyUser.Role)

	mockRepo.AssertExpectations(t)
}
