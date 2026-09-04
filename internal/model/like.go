package model

import "time"

type Like struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"not null;index"`
	User      *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	ArtworkID uint      `json:"artwork_id" gorm:"not null;index"`
	Artwork   *Artwork  `json:"artwork,omitempty" gorm:"foreignKey:ArtworkID"`
	CreatedAt time.Time `json:"created_at"`
}
