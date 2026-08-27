package config

import (
	"context"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
)

// Inisialisasi koneksi Redis
func ConnectRedis(cfg *Config) *redis.Client {
	// Membuat alamat Redis, contoh: localhost:6379
	addr := fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort)

	// Membangun koneksi ke Redis
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: "", // Tidak ada password untuk versi lokal ini
		DB:       0,  // Menggunakan database default Redis (index 0)
	})

	// Mengetes koneksi (nge-Ping ke Redis)
	// context.Background() ibarat bilang: "Lakukan proses ini tanpa batas waktu"
	err := rdb.Ping(context.Background()).Err()
	if err != nil {
		log.Fatalf("Gagal terhubung ke Redis: %v", err)
	}

	log.Println("Successfully connected to Redis")
	return rdb
}
