package service

import (
	"testing"

	"github.com/sandi/lumiina/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockCommentRepository struct {
	mock.Mock
}

func (m *MockCommentRepository) Create(comment *model.Comment) error {
	args := m.Called(comment)
	return args.Error(0)
}

func (m *MockCommentRepository) GetByArtworkID(artworkID uint, limit int, offset int) ([]model.Comment, int64, error) {
	args := m.Called(artworkID, limit, offset)
	if args.Get(0) != nil {
		return args.Get(0).([]model.Comment), args.Get(1).(int64), args.Error(2)
	}
	return nil, 0, args.Error(2)
}

func (m *MockCommentRepository) GetByID(id uint) (*model.Comment, error) {
	args := m.Called(id)
	if args.Get(0) != nil {
		return args.Get(0).(*model.Comment), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockCommentRepository) Delete(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func TestCreateComment_Success(t *testing.T) {
	mockRepo := new(MockCommentRepository)
	commentService := NewCommentService(mockRepo)

	comment := &model.Comment{
		Content:   "Masterpiece artwork!",
		ArtworkID: 1,
		UserID:    2,
	}

	mockRepo.On("Create", comment).Return(nil)

	err := commentService.CreateComment(comment)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestDeleteComment_Forbidden(t *testing.T) {
	mockRepo := new(MockCommentRepository)
	commentService := NewCommentService(mockRepo)

	existingComment := &model.Comment{
		ID:        1,
		Content:   "Nice art",
		ArtworkID: 1,
		UserID:    2, // Owned by User 2
	}

	mockRepo.On("GetByID", uint(1)).Return(existingComment, nil)

	// User 3 (regular) tries to delete User 2's comment
	err := commentService.DeleteComment(1, 3, "regular")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "forbidden")
	mockRepo.AssertExpectations(t)
}

func TestDeleteComment_AdminSuccess(t *testing.T) {
	mockRepo := new(MockCommentRepository)
	commentService := NewCommentService(mockRepo)

	existingComment := &model.Comment{
		ID:        1,
		Content:   "Nice art",
		ArtworkID: 1,
		UserID:    2, // Owned by User 2
	}

	mockRepo.On("GetByID", uint(1)).Return(existingComment, nil)
	mockRepo.On("Delete", uint(1)).Return(nil)

	// User 99 (Admin) deletes User 2's comment
	err := commentService.DeleteComment(1, 99, "admin")

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestCreateComment_XSSSanitization(t *testing.T) {
	mockRepo := new(MockCommentRepository)
	commentService := NewCommentService(mockRepo)

	comment := &model.Comment{
		Content:   "<script>alert('xss')</script>",
		ArtworkID: 1,
		UserID:    2,
	}

	mockRepo.On("Create", mock.MatchedBy(func(c *model.Comment) bool {
		return c.Content == "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
	})).Return(nil)

	err := commentService.CreateComment(comment)

	assert.NoError(t, err)
	assert.Equal(t, "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;", comment.Content)
	mockRepo.AssertExpectations(t)
}
