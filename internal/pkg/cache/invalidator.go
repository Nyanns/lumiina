package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

// InvalidateArtworkCache performs batched background invalidation of all artwork-related cache keys.
func InvalidateArtworkCache(rdb *redis.Client) {
	if rdb == nil {
		return
	}

	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		patterns := []string{"artworks:page:*", "artworks:trending:*", "artworks:recommended:*", "tags:popular:*"}
		for _, pattern := range patterns {
			var batchKeys []string
			iter := rdb.Scan(bgCtx, 0, pattern, 100).Iterator()
			for iter.Next(bgCtx) {
				batchKeys = append(batchKeys, iter.Val())
				if len(batchKeys) >= 100 {
					_ = rdb.Del(bgCtx, batchKeys...).Err()
					batchKeys = batchKeys[:0]
				}
			}
			if len(batchKeys) > 0 {
				_ = rdb.Del(bgCtx, batchKeys...).Err()
			}
		}
	}()
}
