package model

import "time"

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"unique;not null"`
	Password  string    `json:"-" gorm:"not null"` // JSON "-" artinya password jangan pernah dikirim ke Frontend!
	Role      string    `json:"role" gorm:"default:'regular'"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Artworks []Artwork `json:"artworks,omitempty"`
}
