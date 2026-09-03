package config

import (
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	DBHost        string
	DBUser        string
	DBPassword    string
	DBName        string
	DBPort        string
	JWTSecret     string
	CloudinaryURL string
	RedisHost     string
	RedisPort     string
	RedisPassword string
	SMTPHost      string
	SMTPPort      string
	SMTPEmail     string
	SMTPPassword  string
	AppBaseURL    string
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

	baseURL := getEnvOrDefault("APP_BASE_URL", "http://localhost:8080")
	secret := getEnvOrDefault("JWT_SECRET", "supersecretkey_fallback_please_change_in_production")
	port := getEnvOrDefault("PORT", "8080")
	dbHost := getEnvOrDefault("DB_HOST", "localhost")
	dbPort := getEnvOrDefault("DB_PORT", "5432")
	dbUser := getEnvOrDefault("DB_USER", "postgres")
	dbName := getEnvOrDefault("DB_NAME", "lumiina_db")
	redisHost := getEnvOrDefault("REDIS_HOST", "localhost")
	redisPort := getEnvOrDefault("REDIS_PORT", "6379")

	cloudinaryURL := os.Getenv("CLOUDINARY_SECRET")

	return &Config{
		Port:          port,
		DBHost:        dbHost,
		DBPort:        dbPort,
		DBUser:        dbUser,
		DBPassword:    os.Getenv("DB_PASSWORD"),
		DBName:        dbName,
		JWTSecret:     secret,
		CloudinaryURL: cloudinaryURL,
		RedisHost:     redisHost,
		RedisPort:     redisPort,
		RedisPassword: os.Getenv("REDIS_PASSWORD"),
		SMTPHost:      os.Getenv("SMTP_HOST"),
		SMTPPort:      os.Getenv("SMTP_PORT"),
		SMTPEmail:     os.Getenv("SMTP_EMAIL"),
		SMTPPassword:  os.Getenv("SMTP_PASSWORD"),
		AppBaseURL:    baseURL,
	}
}
