package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// AdminOnly restricts endpoint access to users with the 'admin' role
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Role not found in context"})
			return
		}

		if roleStr, ok := role.(string); !ok || roleStr != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Forbidden: Admin access required",
			})
			return
		}

		c.Next()
	}
}
