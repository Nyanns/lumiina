package config

import (
	"log"
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
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("Peringatan: file .env tidak ditemukan")
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "supersecretkey_fallback" // Fallback jika .env lupa diset
	}

	// Mengambil CLOUDINARY_SECRET sesuai yang didefinisikan user
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
	}
}
