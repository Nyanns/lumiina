package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimiterMiddleware membatasi jumlah request per IP
func RateLimiterMiddleware(rdb *redis.Client, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ambil alamat IP tamu yang datang
		ip := c.ClientIP()

		// Buat "KTP" sementara di Redis. Contoh: "rate_limit:192.168.1.5"
		key := "rate_limit:" + ip

		ctx := context.Background()

		// rdb.Incr ibarat Satpam mencetak tiket/klik counter.
		// Kalau kunci belum ada, otomatis dibuat jadi 1.
		count, err := rdb.Incr(ctx, key).Result()
		if err != nil {
			// Kalau alat klik Redis rusak, biarkan tamu masuk daripada restoran tutup total.
			c.Next()
			return
		}

		// Jika ini percobaan pertama (count == 1), nyalakan timer kadaluarsa (TTL) tiketnya
		if count == 1 {
			rdb.Expire(ctx, key, window)
		}

		// Jika jumlah percobaan melebihi limit maksimal
		if count > int64(limit) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests. Please try again later.",
			})
			return
		}

		// Kalau masih aman, silakan masuk ke fitur selanjutnya
		c.Next()
	}
}
