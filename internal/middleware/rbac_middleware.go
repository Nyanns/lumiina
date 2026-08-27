package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// AdminOnly adalah RBAC Middleware khusus untuk mengecek apakah user memiliki role 'admin'
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Mengambil role dari dalam Gin Context (yang sebelumnya sudah diset oleh AuthMiddleware)
		role, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Role not found in token"})
			return
		}

		// Memastikan role-nya benar-benar string dan bernilai "admin"
		if roleStr, ok := role.(string); !ok || roleStr != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Akses Ditolak: Fitur ini hanya untuk Admin",
			})
			return
		}

		// Jika dia Admin, silakan masuk!
		c.Next()
	}
}
