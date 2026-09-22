package middleware

import (
	"crypto/subtle"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// MetricsAuthMiddleware guards Prometheus /metrics from unauthorized external scraping.
// It allows loopback requests (127.0.0.1, ::1) unconditionally for local scrapers.
// For external requests, it requires either:
//   - Header "Authorization: Bearer <token>"
//   - Header "X-Metrics-Token: <token>"
// In production, when unauthorized, it aborts with HTTP 404 to keep the endpoint hidden from scanners.
func MetricsAuthMiddleware(expectedToken, appEnv string) gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		// Permit loopback requests unconditionally (internal scrapers on same host)
		if clientIP == "127.0.0.1" || clientIP == "::1" || clientIP == "localhost" {
			c.Next()
			return
		}

		// In non-production (e.g. development), allow if token is not configured
		if expectedToken == "" && appEnv != "production" {
			c.Next()
			return
		}

		// Check Authorization header or X-Metrics-Token
		var providedToken string
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			providedToken = strings.TrimPrefix(authHeader, "Bearer ")
		} else if customToken := c.GetHeader("X-Metrics-Token"); customToken != "" {
			providedToken = customToken
		}

		if providedToken == "" || expectedToken == "" || subtle.ConstantTimeCompare([]byte(providedToken), []byte(expectedToken)) != 1 {
			// In production, return 404 to avoid confirming the existence of /metrics
			if appEnv == "production" {
				c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Not found"})
				return
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: metrics token required"})
			return
		}

		c.Next()
	}
}
