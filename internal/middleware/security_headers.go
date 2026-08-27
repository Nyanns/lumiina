package middleware

import "github.com/gin-gonic/gin"

// SecurityHeadersMiddleware adds defense-in-depth HTTP security headers
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent clickjacking attacks
		c.Header("X-Frame-Options", "DENY")

		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Enable XSS filter in legacy browsers
		c.Header("X-XSS-Protection", "1; mode=block")

		// Control referrer information sent in requests
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Restrict resource loading to origin by default
		c.Header("Content-Security-Policy", "default-src 'self'")

		c.Next()
	}
}
