package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Ambil "Amplop" (Header Authorization)
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is missing"})
			return
		}

		// 2. Buka Amplopnya, ambil isinya (pisahkan kata "Bearer" dan token aslinya)
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			return
		}
		tokenString := parts[1]

		// 3. Cek Stempel Server (Validasi Token)
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Pastikan tinta hologramnya (algoritmanya) benar
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(jwtSecret), nil
		})

		// Jika token palsu atau sudah expired
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// 4. Baca isi ID Card (Claims)
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			// Simpan data ke loker (Gin Context) agar Handler nanti tidak usah ngecek token lagi
			c.Set("user_id", claims["user_id"])
			c.Set("role", claims["role"])
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}

		// 5. Aman! Silakan masuk ke pintu selanjutnya
		c.Next()
	}
}
