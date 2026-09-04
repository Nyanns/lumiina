package model

import (
	"encoding/json"
	"time"

	"github.com/sandi/lumiina/internal/pkg/hashid"
)

type Comment struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Content   string    `json:"content" gorm:"not null"`
	ArtworkID uint      `json:"artwork_id" gorm:"not null;index"`
	UserID    uint      `json:"user_id" gorm:"not null;index"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

type CreateCommentRequest struct {
	Content string `json:"content" binding:"required,min=1,max=1000"`
}

// MarshalJSON serializes Comment with obfuscated string IDs for ID and ArtworkID
func (c Comment) MarshalJSON() ([]byte, error) {
	type Alias Comment
	return json.Marshal(&struct {
		ID        string `json:"id"`
		ArtworkID string `json:"artwork_id"`
		Alias
	}{
		ID:        hashid.Encode(c.ID),
		ArtworkID: hashid.Encode(c.ArtworkID),
		Alias:     (Alias)(c),
	})
}

// UnmarshalJSON deserializes Comment supporting both hash strings and numeric IDs
func (c *Comment) UnmarshalJSON(data []byte) error {
	type Alias Comment
	aux := &struct {
		ID        interface{} `json:"id"`
		ArtworkID interface{} `json:"artwork_id"`
		*Alias
	}{
		Alias: (*Alias)(c),
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
		c.ID = id
	case float64:
		c.ID = uint(v)
	}

	switch v := aux.ArtworkID.(type) {
	case string:
		aid, err := hashid.Decode(v)
		if err != nil {
			return err
		}
		c.ArtworkID = aid
	case float64:
		c.ArtworkID = uint(v)
	}
	return nil
}
