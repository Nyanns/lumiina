package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

var rateLimitScript = redis.NewScript(`
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return {current, ttl}
`)

// RateLimiterMiddleware limits incoming requests per client IP with atomic Redis Lua script
func RateLimiterMiddleware(rdb *redis.Client, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if rdb == nil {
			c.Next()
			return
		}

		ip := c.ClientIP()
		key := "rate_limit:" + ip
		ctx := c.Request.Context()

		windowSeconds := int(window.Seconds())
		if windowSeconds <= 0 {
			windowSeconds = 60
		}

		res, err := rateLimitScript.Run(ctx, rdb, []string{key}, windowSeconds).Slice()
		if err != nil {
			// Fail-open strategy: allow traffic if Redis rate limiter fails
			c.Next()
			return
		}

		count := res[0].(int64)
		ttl := res[1].(int64)

		remaining := int64(limit) - count
		if remaining < 0 {
			remaining = 0
		}

		// Standard RFC Rate Limiting Headers
		c.Header("X-RateLimit-Limit", strconv.Itoa(limit))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(remaining, 10))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(ttl, 10))

		if count > int64(limit) {
			c.Header("Retry-After", strconv.FormatInt(ttl, 10))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many requests. Please try again later.",
				"retry_after": fmt.Sprintf("%d seconds", ttl),
			})
			return
		}

		c.Next()
	}
}
