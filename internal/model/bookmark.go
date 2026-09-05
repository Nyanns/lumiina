package model

import "time"

type Bookmark struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id" gorm:"not null;uniqueIndex:idx_user_artwork_bookmark"`
	User      *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`
	ArtworkID uint      `json:"artwork_id" gorm:"not null;uniqueIndex:idx_user_artwork_bookmark"`
	Artwork   *Artwork  `json:"artwork,omitempty" gorm:"foreignKey:ArtworkID"`
	CreatedAt time.Time `json:"created_at"`
}
