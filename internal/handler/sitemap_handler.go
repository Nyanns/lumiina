package handler

import (
	"fmt"
	"html"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/pkg/hashid"
	"gorm.io/gorm"
)

type SitemapHandler struct {
	db      *gorm.DB
	rdb     *redis.Client
	baseURL string
}

func NewSitemapHandler(db *gorm.DB, rdb *redis.Client, baseURL string) *SitemapHandler {
	cleanBase := strings.TrimRight(baseURL, "/")
	if cleanBase == "" {
		cleanBase = "https://lumiina.art"
	}
	return &SitemapHandler{
		db:      db,
		rdb:     rdb,
		baseURL: cleanBase,
	}
}

type sitemapArtworkRecord struct {
	ID        uint
	Title     string
	ImageURL  string
	UpdatedAt time.Time
}

type sitemapUserRecord struct {
	Username  string
	UpdatedAt time.Time
}

// GenerateSitemap dynamically builds a Google Sitemaps 0.9 & Image Sitemap 1.1 compliant XML.
// Caches XML in Redis with 30-minute TTL to ensure sub-millisecond response to crawlers.
func (h *SitemapHandler) GenerateSitemap(c *gin.Context) {
	ctx := c.Request.Context()
	cacheKey := "seo:sitemap_xml"

	// 1. Try Redis cache first
	if h.rdb != nil {
		cachedXML, err := h.rdb.Get(ctx, cacheKey).Result()
		if err == nil && cachedXML != "" {
			c.Header("Cache-Control", "public, max-age=1800, s-maxage=1800")
			c.Data(http.StatusOK, "application/xml; charset=utf-8", []byte(cachedXML))
			return
		}
	}

	// 2. Query database for artworks and artists
	var artworks []sitemapArtworkRecord
	if err := h.db.Model(&model.Artwork{}).
		Select("id, title, image_url, updated_at").
		Order("updated_at desc").
		Limit(5000).
		Scan(&artworks).Error; err != nil {
		slog.Error("Sitemap: failed to query artworks", "error", err)
	}

	var artists []sitemapUserRecord
	if err := h.db.Model(&model.User{}).
		Select("username, updated_at").
		Where("is_verified = ?", true).
		Order("updated_at desc").
		Limit(1000).
		Scan(&artists).Error; err != nil {
		slog.Error("Sitemap: failed to query artists", "error", err)
	}

	// 3. Assemble standard XML sitemap
	nowDate := time.Now().Format("2006-01-02")
	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	b.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"` + "\n")
	b.WriteString(`        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">` + "\n")

	// Static Core Routes
	staticRoutes := []struct {
		path       string
		changefreq string
		priority   string
	}{
		{"/", "hourly", "1.0"},
		{"/explore", "daily", "0.9"},
		{"/trending", "hourly", "0.9"},
		{"/recommended", "daily", "0.8"},
		{"/about", "monthly", "0.8"},
		{"/guidelines", "monthly", "0.7"},
		{"/terms", "monthly", "0.6"},
		{"/privacy", "monthly", "0.6"},
	}

	for _, r := range staticRoutes {
		b.WriteString("  <url>\n")
		b.WriteString(fmt.Sprintf("    <loc>%s%s</loc>\n", h.baseURL, r.path))
		b.WriteString(fmt.Sprintf("    <lastmod>%s</lastmod>\n", nowDate))
		b.WriteString(fmt.Sprintf("    <changefreq>%s</changefreq>\n", r.changefreq))
		b.WriteString(fmt.Sprintf("    <priority>%s</priority>\n", r.priority))
		b.WriteString("  </url>\n")
	}

	// Dynamic Artwork Routes with Google Image Sitemap extensions
	for _, art := range artworks {
		slug := hashid.Encode(art.ID)
		if slug == "" {
			slug = fmt.Sprintf("%d", art.ID)
		}
		modDate := art.UpdatedAt.Format("2006-01-02")
		if modDate == "0001-01-01" {
			modDate = nowDate
		}

		b.WriteString("  <url>\n")
		b.WriteString(fmt.Sprintf("    <loc>%s/artworks/%s</loc>\n", h.baseURL, slug))
		b.WriteString(fmt.Sprintf("    <lastmod>%s</lastmod>\n", modDate))
		b.WriteString("    <changefreq>weekly</changefreq>\n")
		b.WriteString("    <priority>0.8</priority>\n")
		if art.ImageURL != "" {
			cleanTitle := html.EscapeString(art.Title)
			cleanImageURL := html.EscapeString(art.ImageURL)
			b.WriteString("    <image:image>\n")
			b.WriteString(fmt.Sprintf("      <image:loc>%s</image:loc>\n", cleanImageURL))
			if cleanTitle != "" {
				b.WriteString(fmt.Sprintf("      <image:title>%s</image:title>\n", cleanTitle))
			}
			b.WriteString("    </image:image>\n")
		}
		b.WriteString("  </url>\n")
	}

	// Dynamic Artist Profile Routes
	for _, artist := range artists {
		if artist.Username == "" {
			continue
		}
		modDate := artist.UpdatedAt.Format("2006-01-02")
		if modDate == "0001-01-01" {
			modDate = nowDate
		}

		b.WriteString("  <url>\n")
		b.WriteString(fmt.Sprintf("    <loc>%s/profile/%s</loc>\n", h.baseURL, html.EscapeString(artist.Username)))
		b.WriteString(fmt.Sprintf("    <lastmod>%s</lastmod>\n", modDate))
		b.WriteString("    <changefreq>daily</changefreq>\n")
		b.WriteString("    <priority>0.7</priority>\n")
		b.WriteString("  </url>\n")
	}

	b.WriteString("</urlset>\n")
	xmlOutput := b.String()

	// 4. Cache in Redis (30-minute expiration)
	if h.rdb != nil {
		_ = h.rdb.Set(ctx, cacheKey, xmlOutput, 30*time.Minute).Err()
	}

	c.Header("Cache-Control", "public, max-age=1800, s-maxage=1800")
	c.Data(http.StatusOK, "application/xml; charset=utf-8", []byte(xmlOutput))
}
