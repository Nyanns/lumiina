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

func (m *MockUserRepository) UpdateProfileFields(userID uint, updates map[string]interface{}) error {
	args := m.Called(userID, updates)
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

func (m *MockUserRepository) GetProfileByIdentifier(identifier string) (*model.User, error) {
	args := m.Called(identifier)
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
		Password: "P@ssword123!",
	}

	mockRepo.On("CreateUser", mock.Anything).Return(nil)

	// Act
	err := userService.Register(dummyUser)

	// Assert
	assert.NoError(t, err)
	assert.NotEqual(t, "P@ssword123!", dummyUser.Password)
	assert.NotEmpty(t, dummyUser.Password)
	assert.Equal(t, "regular", dummyUser.Role)
	assert.False(t, dummyUser.IsVerified)

	mockRepo.AssertExpectations(t)
}

func TestRegister_WeakPasswordRejected(t *testing.T) {
	mockRepo := new(MockUserRepository)
	userService := NewUserService(mockRepo, nil, nil, "http://localhost:8080")

	dummyUser := &model.User{
		Username: "sandi",
		Email:    "sandi@htb.com",
		Password: "onlylowercase",
	}

	err := userService.Register(dummyUser)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "password must contain at least one uppercase letter")
}

func TestLogin_Unverified(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	userService := NewUserService(mockRepo, nil, nil, "http://localhost:8080")

	dummyUser := &model.User{
		Username: "sandi",
		Email:    "sandi@htb.com",
		Password: "P@ssword123!",
	}
	mockRepo.On("CreateUser", mock.Anything).Return(nil)
	_ = userService.Register(dummyUser)

	mockRepo.On("FindByIdentifier", "sandi").Return(dummyUser, nil)

	// Act
	user, err := userService.Login("sandi", "P@ssword123!")

	// Assert
	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Contains(t, err.Error(), "Your account is not verified yet")
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

func TestLogin_NonExistentUser_ConstantTimeMitigation(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	userService := NewUserService(mockRepo, nil, nil, "http://localhost:8080")

	mockRepo.On("FindByIdentifier", "ghost_user").Return(nil, assert.AnError)

	// Act
	user, err := userService.Login("ghost_user", "password123")

	// Assert: Returns sanitized generic error
	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Equal(t, "Invalid username/email or password combination.", err.Error())
	mockRepo.AssertExpectations(t)
}

func TestRevokeToken_NilRedis_Safe(t *testing.T) {
	mockRepo := new(MockUserRepository)
	userService := NewUserService(mockRepo, nil, nil, "http://localhost:8080")

	// Act & Assert
	err := userService.RevokeToken(nil, "dummy_token", 0)
	assert.NoError(t, err)

	isRevoked := userService.IsTokenRevoked(nil, "dummy_token")
	assert.False(t, isRevoked)
}
