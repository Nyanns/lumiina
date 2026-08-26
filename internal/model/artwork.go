package model

import "time"

type Artwork struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url" gorm:"not null"`
	UserID      uint      `json:"user_id" gorm:"not null;index"` // (Foreign Key) User + Indexed untuk performa pencarian
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relasi Many-to-Many
	Tags []Tag `json:"tags,omitempty" gorm:"many2many:artwork_tags;"`
}
