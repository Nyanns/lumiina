package model

import "time"

type Like struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"not null;uniqueIndex:idx_user_artwork"`
	User      *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	ArtworkID uint      `json:"artwork_id" gorm:"not null;uniqueIndex:idx_user_artwork"`
	Artwork   *Artwork  `json:"artwork,omitempty" gorm:"foreignKey:ArtworkID"`
	CreatedAt time.Time `json:"created_at"`
}
