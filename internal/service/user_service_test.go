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

func (m *MockUserRepository) FindByID(id uint) (*model.User, error) {
	args := m.Called(id)
	if args.Get(0) != nil {
		return args.Get(0).(*model.User), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockUserRepository) FindByEmail(email string) (*model.User, error) {
	args := m.Called(email)
	if args.Get(0) != nil {
		return args.Get(0).(*model.User), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockUserRepository) UpdateUser(user *model.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) SearchUsers(query string, limit int, offset int) ([]model.User, int64, error) {
	args := m.Called(query, limit, offset)
	if args.Get(0) != nil {
		return args.Get(0).([]model.User), args.Get(1).(int64), args.Error(2)
	}
	return nil, 0, args.Error(2)
}

func (m *MockUserRepository) GetProfileByID(id uint) (*model.User, error) {
	args := m.Called(id)
	if args.Get(0) != nil {
		return args.Get(0).(*model.User), args.Error(1)
	}
	return nil, args.Error(1)
}

func TestRegister_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	userService := NewUserService(mockRepo, nil, nil, "http://localhost:8080")

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
	assert.False(t, dummyUser.IsVerified)

	mockRepo.AssertExpectations(t)
}

func TestLogin_Unverified(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	userService := NewUserService(mockRepo, nil, nil, "http://localhost:8080")

	dummyUser := &model.User{
		Username: "sandi",
		Email:    "sandi@htb.com",
		Password: "passwordrahasia",
	}
	mockRepo.On("CreateUser", mock.Anything).Return(nil)
	_ = userService.Register(dummyUser)

	mockRepo.On("FindByIdentifier", "sandi").Return(dummyUser, nil)

	// Act
	user, err := userService.Login("sandi", "passwordrahasia")

	// Assert
	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Contains(t, err.Error(), "belum diverifikasi")
	mockRepo.AssertExpectations(t)
}

func TestForgotPassword_NonExistentEmail_NoError(t *testing.T) {
	// Arrange (Anti-Enumeration test)
	mockRepo := new(MockUserRepository)
	userService := NewUserService(mockRepo, nil, nil, "http://localhost:8080")

	mockRepo.On("FindByEmail", "unknown@htb.com").Return(nil, assert.AnError)

	// Act
	err := userService.ForgotPassword("unknown@htb.com")

	// Assert: Should return nil so attackers cannot enumerate valid emails
	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}
