package model

import "time"

type User struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	Username   string    `json:"username" gorm:"unique;not null"`
	Email      string    `json:"email" gorm:"unique;not null"`
	Password   string    `json:"-" gorm:"not null"`
	Role       string    `json:"role" gorm:"default:'regular'"`
	IsVerified bool      `json:"is_verified" gorm:"default:false"`
	DisplayName string    `json:"display_name" gorm:"default:''"`
	Bio         string    `json:"bio" gorm:"type:text;default:''"`
	AvatarURL   string    `json:"avatar_url" gorm:"default:''"`
	BannerURL   string    `json:"banner_url" gorm:"default:''"`
	Location    string    `json:"location" gorm:"default:''"`
	Website     string    `json:"website" gorm:"default:''"`
	SocialLinks string    `json:"social_links" gorm:"type:text;default:'[]'"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Artworks []Artwork `json:"artworks,omitempty"`
	Comments []Comment `json:"comments,omitempty"`
}

type UpdateProfileRequest struct {
	DisplayName string `json:"display_name" binding:"max=50"`
	Bio         string `json:"bio" binding:"max=1000"`
	Location    string `json:"location" binding:"max=100"`
	Website     string `json:"website" binding:"max=255"`
	SocialLinks string `json:"social_links"`
}

type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required"` // Email or Username
	Password   string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username        string `json:"username" binding:"required,alphanum,min=3,max=30"`
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" binding:"required,min=8,eqfield=Password"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Token           string `json:"token" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" binding:"required,min=8,eqfield=NewPassword"`
}
