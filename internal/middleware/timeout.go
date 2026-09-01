package middleware

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
)

// TimeoutMiddleware applies a request-scoped deadline to downstream handlers.
func TimeoutMiddleware(timeoutDuration time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeoutDuration)
		defer cancel()

		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
