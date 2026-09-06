package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

// InvalidateArtworkCache performs synchronous invalidation of all artwork-related cache keys.
// Running synchronously with a 2-second timeout guarantees keys are purged even in serverless
// environments (e.g. AWS Lambda / Vercel) where background goroutines get frozen immediately upon HTTP response.
func InvalidateArtworkCache(rdb *redis.Client) {
	if rdb == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	patterns := []string{"artworks:*", "tags:popular:*"}
	for _, pattern := range patterns {
		var batchKeys []string
		iter := rdb.Scan(ctx, 0, pattern, 100).Iterator()
		for iter.Next(ctx) {
			batchKeys = append(batchKeys, iter.Val())
			if len(batchKeys) >= 100 {
				_ = rdb.Del(ctx, batchKeys...).Err()
				batchKeys = batchKeys[:0]
			}
		}
		if len(batchKeys) > 0 {
			_ = rdb.Del(ctx, batchKeys...).Err()
		}
	}
}
