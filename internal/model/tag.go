package model

import "time"

type Tag struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"unique;not null"`
	CreatedAt time.Time `json:"created_at"`

	Artworks []Artwork `json:"artworks,omitempty" gorm:"many2many:artwork_tags;"`
}
