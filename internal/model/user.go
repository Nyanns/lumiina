package model

import "time"

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"unique;not null"`
	Email     string    `json:"email" gorm:"unique;not null"`
	Password  string    `json:"-" gorm:"not null"` // JSON "-" artinya password jangan pernah dikirim ke Frontend!
	Role      string    `json:"role" gorm:"default:'regular'"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Artworks []Artwork `json:"artworks,omitempty"`
}

type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required"` // Bisa berupa Email atau Username
	Password   string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}
