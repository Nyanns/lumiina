package model

import (
	"encoding/json"
	"time"

	"github.com/sandi/lumiina/internal/pkg/hashid"
)

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

// MarshalJSON serializes the Artwork model with an obfuscated string ID (e.g. "H1rJsY")
// to prevent ID enumeration and scraping attacks. The outer ID field shadows the embedded
// Alias.ID uint field per Go encoding/json precedence rules.
func (a Artwork) MarshalJSON() ([]byte, error) {
	type Alias Artwork
	return json.Marshal(&struct {
		ID string `json:"id"`
		Alias
	}{
		ID:    hashid.Encode(a.ID),
		Alias: (Alias)(a),
	})
}

// UnmarshalJSON deserializes an Artwork model supporting both hash strings and numeric IDs.
func (a *Artwork) UnmarshalJSON(data []byte) error {
	type Alias Artwork
	aux := &struct {
		ID interface{} `json:"id"`
		*Alias
	}{
		Alias: (*Alias)(a),
	}
	if err := json.Unmarshal(data, aux); err != nil {
		return err
	}
	switch v := aux.ID.(type) {
	case string:
		id, err := hashid.Decode(v)
		if err != nil {
			return err
		}
		a.ID = id
	case float64:
		a.ID = uint(v)
	}
	return nil
}
