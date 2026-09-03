package service

import (
	"context"
	"errors"
	"testing"

	"github.com/sandi/lumiina/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockArtworkRepository mocks repository.ArtworkRepository
type MockArtworkRepository struct {
	mock.Mock
}

func (m *MockArtworkRepository) GetAllArtworks(limit int, offset int, search string, tag string, userID uint) ([]model.Artwork, int64, error) {
	args := m.Called(limit, offset, search, tag, userID)
	if args.Get(0) != nil {
		return args.Get(0).([]model.Artwork), args.Get(1).(int64), args.Error(2)
	}
	return nil, 0, args.Error(2)
}

func (m *MockArtworkRepository) Create(artwork *model.Artwork, tagNames []string) error {
	args := m.Called(artwork, tagNames)
	return args.Error(0)
}

func (m *MockArtworkRepository) GetByID(id uint) (*model.Artwork, error) {
	args := m.Called(id)
	if args.Get(0) != nil {
		return args.Get(0).(*model.Artwork), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockArtworkRepository) Update(artwork *model.Artwork) error {
	args := m.Called(artwork)
	return args.Error(0)
}

func (m *MockArtworkRepository) Delete(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

// MockCloudinaryService mocks cloudinary.CloudinaryService
type MockCloudinaryService struct {
	mock.Mock
}

func (m *MockCloudinaryService) UploadImage(ctx context.Context, file interface{}, folder string) (string, error) {
	args := m.Called(ctx, file, folder)
	return args.String(0), args.Error(1)
}

func TestGetAllArtworks_ClampingLimits(t *testing.T) {
	mockRepo := new(MockArtworkRepository)
	svc := NewArtworkService(mockRepo, nil)

	// Test limit <= 0 clamped to 20, offset < 0 clamped to 0
	expectedArtworks := []model.Artwork{{ID: 1, Title: "Lumi Art"}}
	mockRepo.On("GetAllArtworks", 20, 0, "lumi", "anime", uint(0)).
		Return(expectedArtworks, int64(1), nil)

	artworks, total, err := svc.GetAllArtworks(0, -5, " lumi ", " anime ", 0)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, artworks, 1)

	// Test limit > 50 clamped to 50
	mockRepo.On("GetAllArtworks", 50, 10, "", "", uint(0)).
		Return(expectedArtworks, int64(1), nil)

	artworks, total, err = svc.GetAllArtworks(100, 10, "", "", 0)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)

	mockRepo.AssertExpectations(t)
}

func TestGetArtworkByID_Success(t *testing.T) {
	mockRepo := new(MockArtworkRepository)
	svc := NewArtworkService(mockRepo, nil)

	expected := &model.Artwork{ID: 42, Title: "Ina Fan Art", UserID: 10}
	mockRepo.On("GetByID", uint(42)).Return(expected, nil)

	result, err := svc.GetArtworkByID(42)
	assert.NoError(t, err)
	assert.Equal(t, uint(42), result.ID)
	assert.Equal(t, "Ina Fan Art", result.Title)

	mockRepo.AssertExpectations(t)
}

func TestGetArtworkByID_NotFound(t *testing.T) {
	mockRepo := new(MockArtworkRepository)
	svc := NewArtworkService(mockRepo, nil)

	mockRepo.On("GetByID", uint(999)).Return(nil, errors.New("record not found"))

	result, err := svc.GetArtworkByID(999)
	assert.Error(t, err)
	assert.Nil(t, result)

	mockRepo.AssertExpectations(t)
}

func TestUpdateArtwork_Forbidden(t *testing.T) {
	mockRepo := new(MockArtworkRepository)
	svc := NewArtworkService(mockRepo, nil)

	existing := &model.Artwork{ID: 1, UserID: 10, Title: "Original"}
	mockRepo.On("GetByID", uint(1)).Return(existing, nil)

	// User 99 (not owner, regular role) attempts to update
	err := svc.UpdateArtwork(1, 99, "regular", "Hacked Title", "Desc")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "forbidden")

	mockRepo.AssertExpectations(t)
}

func TestUpdateArtwork_AdminAllowed(t *testing.T) {
	mockRepo := new(MockArtworkRepository)
	svc := NewArtworkService(mockRepo, nil)

	existing := &model.Artwork{ID: 1, UserID: 10, Title: "Original"}
	mockRepo.On("GetByID", uint(1)).Return(existing, nil)
	mockRepo.On("Update", mock.Anything).Return(nil)

	// Admin (role: admin) updating someone else's artwork
	err := svc.UpdateArtwork(1, 99, "admin", "Moderated Title", "Clean Desc")
	assert.NoError(t, err)

	mockRepo.AssertExpectations(t)
}

func TestDeleteArtwork_Forbidden(t *testing.T) {
	mockRepo := new(MockArtworkRepository)
	svc := NewArtworkService(mockRepo, nil)

	existing := &model.Artwork{ID: 5, UserID: 10}
	mockRepo.On("GetByID", uint(5)).Return(existing, nil)

	// User 99 (not owner) attempts to delete
	err := svc.DeleteArtwork(5, 99, "regular")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "forbidden")

	mockRepo.AssertExpectations(t)
}

func TestDeleteArtwork_OwnerSuccess(t *testing.T) {
	mockRepo := new(MockArtworkRepository)
	svc := NewArtworkService(mockRepo, nil)

	existing := &model.Artwork{ID: 5, UserID: 10}
	mockRepo.On("GetByID", uint(5)).Return(existing, nil)
	mockRepo.On("Delete", uint(5)).Return(nil)

	// Owner deletes own artwork
	err := svc.DeleteArtwork(5, 10, "regular")
	assert.NoError(t, err)

	mockRepo.AssertExpectations(t)
}
