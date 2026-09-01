package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// ErrorHandlerMiddleware intercepts unhandled panics and returns a structured 500 JSON response,
// preventing process termination and masking stack traces from clients.
func ErrorHandlerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// Log the error and the stack trace internally
				slog.Error("Panic recovered",
					"error", err,
					"path", c.Request.URL.Path,
					"stack", string(debug.Stack()),
				)

				// Respond with a generic error to the client
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error": "Internal server error. Please try again later.",
				})
			}
		}()
		c.Next()
	}
}
