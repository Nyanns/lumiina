package config

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func ConnectDB(cfg *Config) *gorm.DB {
	sslMode := "disable"
	if cfg.AppEnv == "production" || strings.Contains(cfg.DBHost, "supabase.co") || strings.Contains(cfg.DBHost, "supabase.com") || strings.Contains(cfg.DBHost, "neon.tech") {
		sslMode = "require"
	}
	if envSSL := os.Getenv("DB_SSL_MODE"); envSSL != "" {
		sslMode = envSSL
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort, sslMode,
	)

	// Slow query logger: automatically captures queries taking > 200ms
	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
			Colorful:                  false,
		},
	)

	isPooler := strings.Contains(cfg.DBHost, "pooler.supabase.com") || cfg.DBPort == "6543"

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: isPooler || cfg.AppEnv == "production",
	}), &gorm.Config{
		Logger: gormLogger,
		// Performance: Skip default transaction on single writes for ~30-50% speedup
		SkipDefaultTransaction: true,
		// In transaction pooler mode, disable PrepareStmt to prevent prepared statement conflicts
		PrepareStmt: !isPooler,
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to get database instance: %v", err)
	}

	// Enterprise Connection Pool Sizing: Prevents pool exhaustion on Supabase Serverless
	maxOpen := 50
	maxIdle := 25
	if isPooler || cfg.AppEnv == "production" {
		maxOpen = 8
		maxIdle = 4
	}
	sqlDB.SetMaxOpenConns(maxOpen)
	sqlDB.SetMaxIdleConns(maxIdle)
	sqlDB.SetConnMaxLifetime(10 * time.Minute)
	sqlDB.SetConnMaxIdleTime(2 * time.Minute)

	return db
}
