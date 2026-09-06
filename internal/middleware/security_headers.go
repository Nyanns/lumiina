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

		// Enforce HTTPS transmission and protect against SSL stripping (OWASP API8)
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

		// Restrict access to sensitive browser features (Permissions Policy)
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()")

		// Restrict resource loading with safe allowances for styles, fonts, and images
		c.Header("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; script-src 'self'; connect-src 'self'")

		c.Next()
	}
}
