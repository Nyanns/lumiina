package config

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

// ConnectRedis initializes and returns a tuned Redis client with optional TLS support
func ConnectRedis(cfg *Config) *redis.Client {
	addr := fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort)

	opts := &redis.Options{
		Addr:         addr,
		Password:     cfg.RedisPassword,
		DB:           0,
		PoolSize:     50,
		MinIdleConns: 10,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolTimeout:  5 * time.Second,
	}

	if cfg.RedisUseTLS {
		opts.TLSConfig = &tls.Config{
			ServerName: cfg.RedisHost,
		}
	}

	rdb := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := rdb.Ping(ctx).Err()
	if err != nil {
		log.Fatalf("Failed to connect to Redis at %s: %v", addr, err)
	}

	log.Println("Successfully connected to Redis with enterprise connection pool")
	return rdb
}
