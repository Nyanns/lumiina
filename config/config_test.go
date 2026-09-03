package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfig_Validate(t *testing.T) {
	tests := []struct {
		name        string
		cfg         Config
		wantErr     bool
		errContains string
	}{
		{
			name: "Valid configuration",
			cfg: Config{
				DBHost:        "localhost",
				DBName:        "lumiina_db",
				DBUser:        "postgres",
				JWTSecret:     "this_is_a_very_secure_secret_key_at_least_32_characters",
				CloudinaryURL: "cloudinary://123456:abcdef@mycloud",
			},
			wantErr: false,
		},
		{
			name: "Empty JWT_SECRET",
			cfg: Config{
				DBHost:        "localhost",
				DBName:        "lumiina_db",
				DBUser:        "postgres",
				JWTSecret:     "",
				CloudinaryURL: "cloudinary://123:abc@cloud",
			},
			wantErr:     true,
			errContains: "JWT_SECRET is required but empty",
		},
		{
			name: "Insecure default placeholder JWT_SECRET",
			cfg: Config{
				DBHost:        "localhost",
				DBName:        "lumiina_db",
				DBUser:        "postgres",
				JWTSecret:     "supersecretkey_fallback_please_change_in_production",
				CloudinaryURL: "cloudinary://123:abc@cloud",
			},
			wantErr:     true,
			errContains: "insecure default placeholder",
		},
		{
			name: "JWT_SECRET too short",
			cfg: Config{
				DBHost:        "localhost",
				DBName:        "lumiina_db",
				DBUser:        "postgres",
				JWTSecret:     "short_secret",
				CloudinaryURL: "cloudinary://123:abc@cloud",
			},
			wantErr:     true,
			errContains: "must be at least 32 characters",
		},
		{
			name: "Invalid Cloudinary prefix",
			cfg: Config{
				DBHost:        "localhost",
				DBName:        "lumiina_db",
				DBUser:        "postgres",
				JWTSecret:     "this_is_a_very_secure_secret_key_at_least_32_characters",
				CloudinaryURL: "https://invalid-url.com",
			},
			wantErr:     true,
			errContains: "must start with 'cloudinary://'",
		},
		{
			name: "Missing DB parameters",
			cfg: Config{
				DBHost:        "",
				DBName:        "",
				DBUser:        "",
				JWTSecret:     "this_is_a_very_secure_secret_key_at_least_32_characters",
				CloudinaryURL: "cloudinary://123:abc@cloud",
			},
			wantErr:     true,
			errContains: "DB_HOST is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.cfg.Validate()
			if tt.wantErr {
				assert.Error(t, err)
				if tt.errContains != "" {
					assert.Contains(t, err.Error(), tt.errContains)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
