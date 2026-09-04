package model

import "time"

type Artwork struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url" gorm:"not null"`
	UserID      uint      `json:"user_id" gorm:"not null;index"`
	User        *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Tags         []Tag     `json:"tags,omitempty" gorm:"many2many:artwork_tags;"`
	Comments     []Comment `json:"comments,omitempty"`
	CommentCount int64     `json:"comment_count" gorm:"-"`
	LikeCount    int64     `json:"like_count" gorm:"-"`
	IsLiked      bool      `json:"is_liked" gorm:"-"`
}

