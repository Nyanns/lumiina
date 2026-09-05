package service

import (
	"testing"

	"github.com/sandi/lumiina/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockFollowRepository struct {
	mock.Mock
}

func (m *MockFollowRepository) ToggleFollow(followerID uint, followingID uint) (bool, int64, error) {
	args := m.Called(followerID, followingID)
	return args.Bool(0), args.Get(1).(int64), args.Error(2)
}

func (m *MockFollowRepository) IsFollowing(followerID uint, followingID uint) (bool, error) {
	args := m.Called(followerID, followingID)
	return args.Bool(0), args.Error(1)
}

func (m *MockFollowRepository) GetFollowCounts(userID uint) (int64, int64, error) {
	args := m.Called(userID)
	return args.Get(0).(int64), args.Get(1).(int64), args.Error(2)
}

func (m *MockFollowRepository) GetFollowers(userID uint, limit int, offset int) ([]model.FollowUserItem, int64, error) {
	args := m.Called(userID, limit, offset)
	if args.Get(0) != nil {
		return args.Get(0).([]model.FollowUserItem), args.Get(1).(int64), args.Error(2)
	}
	return nil, 0, args.Error(2)
}

func (m *MockFollowRepository) GetFollowing(userID uint, limit int, offset int) ([]model.FollowUserItem, int64, error) {
	args := m.Called(userID, limit, offset)
	if args.Get(0) != nil {
		return args.Get(0).([]model.FollowUserItem), args.Get(1).(int64), args.Error(2)
	}
	return nil, 0, args.Error(2)
}

func (m *MockFollowRepository) BatchCheckFollowing(followerID uint, targetUserIDs []uint) (map[uint]bool, error) {
	args := m.Called(followerID, targetUserIDs)
	if args.Get(0) != nil {
		return args.Get(0).(map[uint]bool), args.Error(1)
	}
	return nil, args.Error(1)
}

func TestToggleFollow_Success(t *testing.T) {
	mockRepo := new(MockFollowRepository)
	followService := NewFollowService(mockRepo)

	mockRepo.On("ToggleFollow", uint(1), uint(2)).Return(true, int64(10), nil)

	isFollowing, count, err := followService.ToggleFollow(1, 2)

	assert.NoError(t, err)
	assert.True(t, isFollowing)
	assert.Equal(t, int64(10), count)
	mockRepo.AssertExpectations(t)
}

func TestToggleFollow_CannotFollowSelf(t *testing.T) {
	mockRepo := new(MockFollowRepository)
	followService := NewFollowService(mockRepo)

	isFollowing, count, err := followService.ToggleFollow(1, 1)

	assert.Error(t, err)
	assert.False(t, isFollowing)
	assert.Equal(t, int64(0), count)
	assert.Contains(t, err.Error(), "cannot follow your own account")
}

func TestGetFollowStatus_Success(t *testing.T) {
	mockRepo := new(MockFollowRepository)
	followService := NewFollowService(mockRepo)

	mockRepo.On("GetFollowCounts", uint(2)).Return(int64(42), int64(15), nil)
	mockRepo.On("IsFollowing", uint(1), uint(2)).Return(true, nil)

	status, err := followService.GetFollowStatus(1, 2)

	assert.NoError(t, err)
	assert.NotNil(t, status)
	assert.True(t, status.IsFollowing)
	assert.Equal(t, int64(42), status.FollowersCount)
	assert.Equal(t, int64(15), status.FollowingCount)
	mockRepo.AssertExpectations(t)
}
