package model

import "time"

// Follow represents the directional relationship where FollowerID follows FollowingID.
type Follow struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	FollowerID  uint      `json:"follower_id" gorm:"not null;uniqueIndex:unique_follower_following"`
	FollowingID uint      `json:"following_id" gorm:"not null;uniqueIndex:unique_follower_following"`
	CreatedAt   time.Time `json:"created_at"`

	Follower  *User `json:"follower,omitempty" gorm:"foreignKey:FollowerID"`
	Following *User `json:"following,omitempty" gorm:"foreignKey:FollowingID"`
}

// FollowStatusResponse holds the current relationship status and follower/following counts.
type FollowStatusResponse struct {
	IsFollowing    bool  `json:"is_following"`
	FollowersCount int64 `json:"followers_count"`
	FollowingCount int64 `json:"following_count"`
}

// FollowUserItem represents a minimal user item returned in followers/following list.
type FollowUserItem struct {
	ID          uint   `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url"`
	Bio         string `json:"bio"`
	IsFollowing bool   `json:"is_following"`
}
