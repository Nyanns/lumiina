package handler_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sandi/lumiina/internal/handler"
	"github.com/stretchr/testify/assert"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestSitemapHandler_GenerateSitemap_StandardOutput(t *testing.T) {
	// Initialize handler with nil DB and nil Redis (defensive fallback mode)
	h := handler.NewSitemapHandler(nil, nil, "https://www.lumiina.art")

	r := gin.New()
	r.GET("/sitemap.xml", h.GenerateSitemap)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/sitemap.xml", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "application/xml; charset=utf-8", w.Header().Get("Content-Type"))
	assert.Contains(t, w.Header().Get("Cache-Control"), "public, max-age=1800")

	body := w.Body.String()

	// 1. Verify XML header and namespaces
	assert.True(t, strings.HasPrefix(body, `<?xml version="1.0" encoding="UTF-8"?>`))
	assert.Contains(t, body, `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`)
	assert.Contains(t, body, `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`)

	// 2. Verify static core routes
	expectedRoutes := []string{
		"https://www.lumiina.art/",
		"https://www.lumiina.art/explore",
		"https://www.lumiina.art/trending",
		"https://www.lumiina.art/recommended",
		"https://www.lumiina.art/about",
		"https://www.lumiina.art/guidelines",
		"https://www.lumiina.art/terms",
		"https://www.lumiina.art/privacy",
	}

	for _, route := range expectedRoutes {
		assert.Contains(t, body, "<loc>"+route+"</loc>", "Sitemap must contain route: "+route)
	}

	// 3. Verify closing tag
	assert.True(t, strings.HasSuffix(strings.TrimSpace(body), "</urlset>"))
}

func TestSitemapHandler_BaseURLFallback(t *testing.T) {
	tests := []struct {
		name     string
		inputURL string
		expected string
	}{
		{
			name:     "Empty baseURL defaults to canonical https://www.lumiina.art",
			inputURL: "",
			expected: "https://www.lumiina.art",
		},
		{
			name:     "Invalid non-HTTP prefix defaults to canonical https://www.lumiina.art",
			inputURL: "APP_BASE_URL",
			expected: "https://www.lumiina.art",
		},
		{
			name:     "Trailing slash is cleanly trimmed",
			inputURL: "https://custom.lumiina.art/",
			expected: "https://custom.lumiina.art",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			h := handler.NewSitemapHandler(nil, nil, tc.inputURL)
			r := gin.New()
			r.GET("/sitemap.xml", h.GenerateSitemap)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest(http.MethodGet, "/sitemap.xml", nil)
			r.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)
			body := w.Body.String()
			assert.Contains(t, body, "<loc>"+tc.expected+"/</loc>")
		})
	}
}
