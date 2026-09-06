package config

import (
	"errors"
	"fmt"
	"log/slog"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv         string
	Port           string
	DBHost         string
	DBUser         string
	DBPassword     string
	DBName         string
	DBPort         string
	JWTSecret      string
	JWTSecretOld   string
	CloudinaryURL  string
	RedisHost      string
	RedisPort      string
	RedisPassword  string
	RedisUseTLS    bool
	SMTPHost       string
	SMTPPort       string
	SMTPEmail      string
	SMTPPassword   string
	AppBaseURL     string
	AllowedOrigins []string
	TrustedProxies []string
}

func getEnvOrDefault(key, defaultValue string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultValue
	}
	return val
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		slog.Warn(".env file not found, loading environment variables")
	}

	appEnv := getEnvOrDefault("APP_ENV", "development")
	baseURL := os.Getenv("APP_BASE_URL")
	if baseURL == "" {
		if vercelURL := os.Getenv("VERCEL_PROJECT_PRODUCTION_URL"); vercelURL != "" {
			baseURL = "https://" + vercelURL
		} else if vercelURL := os.Getenv("VERCEL_URL"); vercelURL != "" {
			baseURL = "https://" + vercelURL
		} else {
			baseURL = "http://localhost:8080"
		}
	}
	secret := os.Getenv("JWT_SECRET")
	secretOld := os.Getenv("JWT_SECRET_OLD")
	port := getEnvOrDefault("PORT", "8080")
	dbHost := getEnvOrDefault("DB_HOST", "localhost")
	dbPort := getEnvOrDefault("DB_PORT", "5432")
	if strings.Contains(dbHost, "pooler.supabase.com") && dbPort == "5432" {
		dbPort = "6543"
	}
	dbUser := getEnvOrDefault("DB_USER", "postgres")
	dbName := getEnvOrDefault("DB_NAME", "lumiina_db")
	redisHost := getEnvOrDefault("REDIS_HOST", "localhost")
	redisPort := getEnvOrDefault("REDIS_PORT", "6379")
	cloudinaryURL := os.Getenv("CLOUDINARY_SECRET")

	// Parse trusted proxies
	proxiesEnv := os.Getenv("TRUSTED_PROXIES")
	var trustedProxies []string
	if proxiesEnv != "" {
		for _, p := range strings.Split(proxiesEnv, ",") {
			if trimmed := strings.TrimSpace(p); trimmed != "" {
				trustedProxies = append(trustedProxies, trimmed)
			}
		}
	}
	if len(trustedProxies) == 0 {
		trustedProxies = []string{"127.0.0.1", "::1"}
	}

	// Parse allowed CORS origins from env, with sensible local dev defaults
	originsEnv := os.Getenv("ALLOWED_ORIGINS")
	var allowedOrigins []string
	if originsEnv != "" {
		for _, o := range strings.Split(originsEnv, ",") {
			trimmed := strings.TrimSpace(o)
			if trimmed != "" {
				// In production, reject plain HTTP unless explicitly localhost
				if appEnv == "production" && !strings.HasPrefix(trimmed, "https://") && !strings.HasPrefix(trimmed, "http://localhost") {
					slog.Warn("Ignoring non-HTTPS origin in production CORS whitelist", "origin", trimmed)
					continue
				}
				allowedOrigins = append(allowedOrigins, trimmed)
			}
		}
	} else {
		allowedOrigins = []string{
			"http://localhost:5173",
			"http://localhost:3000",
			baseURL,
		}
	}

	return &Config{
		AppEnv:         appEnv,
		Port:           port,
		DBHost:         dbHost,
		DBPort:         dbPort,
		DBUser:         dbUser,
		DBPassword:     os.Getenv("DB_PASSWORD"),
		DBName:         dbName,
		JWTSecret:      secret,
		JWTSecretOld:   secretOld,
		CloudinaryURL:  cloudinaryURL,
		RedisHost:      redisHost,
		RedisPort:      redisPort,
		RedisPassword:  os.Getenv("REDIS_PASSWORD"),
		RedisUseTLS:    os.Getenv("REDIS_USE_TLS") == "true" || strings.Contains(redisHost, "upstash.io"),
		SMTPHost:       os.Getenv("SMTP_HOST"),
		SMTPPort:       os.Getenv("SMTP_PORT"),
		SMTPEmail:      os.Getenv("SMTP_EMAIL"),
		SMTPPassword:   os.Getenv("SMTP_PASSWORD"),
		AppBaseURL:     baseURL,
		AllowedOrigins: allowedOrigins,
		TrustedProxies: trustedProxies,
	}
}

// Validate executes strict fail-fast verification on all essential configuration
func (c *Config) Validate() error {
	var errs []string

	// 1. JWT Secret Validation
	if c.JWTSecret == "" {
		errs = append(errs, "JWT_SECRET is required but empty")
	} else if c.JWTSecret == "supersecretkey_fallback_please_change_in_production" {
		errs = append(errs, "JWT_SECRET is using an insecure default placeholder")
	} else if len(c.JWTSecret) < 32 {
		errs = append(errs, fmt.Sprintf("JWT_SECRET length is %d, must be at least 32 characters for HMAC-SHA256 security", len(c.JWTSecret)))
	}

	// 2. Cloudinary Validation
	if c.CloudinaryURL == "" {
		errs = append(errs, "CLOUDINARY_SECRET is required for media uploads")
	} else if !strings.HasPrefix(c.CloudinaryURL, "cloudinary://") {
		errs = append(errs, "CLOUDINARY_SECRET must start with 'cloudinary://'")
	}

	// 3. Database Core Parameters
	if c.DBHost == "" {
		errs = append(errs, "DB_HOST is required")
	}
	if c.DBName == "" {
		errs = append(errs, "DB_NAME is required")
	}
	if c.DBUser == "" {
		errs = append(errs, "DB_USER is required")
	}

	if len(errs) > 0 {
		return errors.New("configuration validation failed:\n - " + strings.Join(errs, "\n - "))
	}
	return nil
}
