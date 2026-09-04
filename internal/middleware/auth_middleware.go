package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
)

// AuthMiddleware validates JWT Bearer tokens from incoming requests and verifies revocation in Redis
func AuthMiddleware(jwtSecret string, rdb ...*redis.Client) gin.HandlerFunc {
	var redisClient *redis.Client
	if len(rdb) > 0 {
		redisClient = rdb[0]
	}

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is missing"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			return
		}
		tokenString := parts[1]

		// Check if token has been revoked / logged out
		if redisClient != nil {
			revokedKey := fmt.Sprintf("revoked_token:%s", tokenString)
			if exists, err := redisClient.Exists(c.Request.Context(), revokedKey).Result(); err == nil && exists > 0 {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token has been revoked. Please login again."})
				return
			}
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			// Check user-level revocation epoch (set after password reset)
			if redisClient != nil {
				if uid, ok := claims["user_id"].(float64); ok {
					if iat, ok := claims["iat"].(float64); ok {
						revKey := fmt.Sprintf("user_revocation:%d", uint(uid))
						if epochStr, err := redisClient.Get(c.Request.Context(), revKey).Result(); err == nil {
							if epoch, err := strconv.ParseInt(epochStr, 10, 64); err == nil {
								if int64(iat) < epoch {
									c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
										"error": "Session invalidated due to password change. Please login again.",
									})
									return
								}
							}
						}
					}
				}
			}

			c.Set("user_id", claims["user_id"])
			c.Set("role", claims["role"])
			c.Set("raw_token", tokenString)
			if exp, ok := claims["exp"].(float64); ok {
				c.Set("token_exp", int64(exp))
			}
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}

		c.Next()
	}
}

// OptionalAuthMiddleware extracts user_id if Bearer token is valid, but allows guest access without blocking
func OptionalAuthMiddleware(jwtSecret string, rdb ...*redis.Client) gin.HandlerFunc {
	var redisClient *redis.Client
	if len(rdb) > 0 {
		redisClient = rdb[0]
	}

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}
		tokenString := parts[1]

		if redisClient != nil {
			revokedKey := fmt.Sprintf("revoked_token:%s", tokenString)
			if exists, err := redisClient.Exists(c.Request.Context(), revokedKey).Result(); err == nil && exists > 0 {
				c.Next()
				return
			}
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(jwtSecret), nil
		})

		if err == nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				c.Set("user_id", claims["user_id"])
				c.Set("role", claims["role"])
				c.Set("raw_token", tokenString)
			}
		}

		c.Next()
	}
}

