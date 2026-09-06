package handler

import (
	"log/slog"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/sandi/lumiina/config"
	"github.com/sandi/lumiina/internal/pkg/cloudinary"
	"github.com/sandi/lumiina/internal/pkg/mailer"
	"github.com/sandi/lumiina/internal/router"
)

var (
	app  *gin.Engine
	once sync.Once
)

func initApp() {
	gin.SetMode(gin.ReleaseMode)
	cfg := config.LoadConfig()

	db := config.ConnectDB(cfg)
	rdb := config.ConnectRedis(cfg)

	cldService, err := cloudinary.NewCloudinaryService(cfg.CloudinaryURL)
	if err != nil {
		slog.Error("Failed to initialize Cloudinary", "error", err)
	}

	mailerService := mailer.NewMailerService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPEmail, cfg.SMTPPassword)

	app = router.SetupRouter(cfg, db, rdb, cldService, mailerService)
}

// Handler is the Vercel Serverless Function entrypoint
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initApp)
	app.ServeHTTP(w, r)
}
