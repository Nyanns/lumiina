package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/sandi/lumiina/config"
	_ "github.com/sandi/lumiina/docs"
	"github.com/sandi/lumiina/internal/pkg/cloudinary"
	"github.com/sandi/lumiina/internal/pkg/mailer"
	"github.com/sandi/lumiina/internal/router"
)

// @title Lumiina API
// @version 1.0
// @description Platform sharing fan art anime (Pixiv-like).
// @host localhost:8080
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	cfg := config.LoadConfig()
	if err := cfg.Validate(); err != nil {
		slog.Error("Configuration validation failed", "error", err)
		os.Exit(1)
	}

	db := config.ConnectDB(cfg)
	if db == nil {
		slog.Error("Failed to connect to database")
		os.Exit(1)
	}

	rdb := config.ConnectRedis(cfg)

	cldService, err := cloudinary.NewCloudinaryService(cfg.CloudinaryURL)
	if err != nil {
		slog.Error("Failed to initialize Cloudinary", "error", err)
		os.Exit(1)
	}

	mailerService := mailer.NewMailerService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPEmail, cfg.SMTPPassword)

	r := router.SetupRouter(cfg, db, rdb, cldService, mailerService)

	// Server configuration: Hardened against Slowloris & resource exhaustion
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,  // Neutralizes Slowloris header stalls
		ReadTimeout:       30 * time.Second, // Maximum duration reading request
		WriteTimeout:      30 * time.Second, // Maximum duration writing response
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20, // 1 MB max header size
	}

	go func() {
		slog.Info("Server is running with hardened timeouts", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Failed to start server", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	<-quit
	slog.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("Server exited cleanly")
}
