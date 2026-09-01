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
	SMTPHost      string
	SMTPPort      string
	SMTPEmail     string
	SMTPPassword  string
	AppBaseURL    string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		slog.Warn(".env file not found, loading environment variables")
	}

	baseURL := os.Getenv("APP_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "supersecretkey_fallback"
	}

	cloudinaryURL := os.Getenv("CLOUDINARY_SECRET")

	return &Config{
		Port:          os.Getenv("PORT"),
		DBHost:        os.Getenv("DB_HOST"),
		DBPort:        os.Getenv("DB_PORT"),
		DBUser:        os.Getenv("DB_USER"),
		DBPassword:    os.Getenv("DB_PASSWORD"),
		DBName:        os.Getenv("DB_NAME"),
		JWTSecret:     secret,
		CloudinaryURL: cloudinaryURL,
		RedisHost:     os.Getenv("REDIS_HOST"),
		RedisPort:     os.Getenv("REDIS_PORT"),
		SMTPHost:      os.Getenv("SMTP_HOST"),
		SMTPPort:      os.Getenv("SMTP_PORT"),
		SMTPEmail:     os.Getenv("SMTP_EMAIL"),
		SMTPPassword:  os.Getenv("SMTP_PASSWORD"),
		AppBaseURL:    baseURL,
	}
}
