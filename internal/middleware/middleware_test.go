package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestRequestIDMiddleware_GeneratedWhenMissing(t *testing.T) {
	r := gin.New()
	r.Use(RequestIDMiddleware())
	r.GET("/test", func(c *gin.Context) {
		reqID := GetRequestID(c)
		c.String(http.StatusOK, reqID)
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	headerID := w.Header().Get(RequestIDHeader)
	assert.NotEmpty(t, headerID)
	assert.Equal(t, headerID, w.Body.String())
}

func TestRequestIDMiddleware_PreservedWhenSupplied(t *testing.T) {
	r := gin.New()
	r.Use(RequestIDMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	customID := "client-trace-12345"
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set(RequestIDHeader, customID)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, customID, w.Header().Get(RequestIDHeader))
}

func TestCORSMiddleware_WhitelistedOrigin(t *testing.T) {
	r := gin.New()
	r.Use(CORSMiddleware("http://localhost:5173", "https://lumiina.art"))
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Valid whitelisted origin
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, "http://localhost:5173", w.Header().Get("Access-Control-Allow-Origin"))
	assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
}

func TestCORSMiddleware_RejectUntrustedOrigin(t *testing.T) {
	r := gin.New()
	r.Use(CORSMiddleware("http://localhost:5173"))
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Malicious untrusted origin
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Origin", "https://evil-attacker.com")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Origin must NOT be echoed with credentials
	assert.Empty(t, w.Header().Get("Access-Control-Allow-Origin"))
	assert.Empty(t, w.Header().Get("Access-Control-Allow-Credentials"))
}

func TestSecurityHeadersMiddleware_CSPNoUnsafeEval(t *testing.T) {
	r := gin.New()
	r.Use(SecurityHeadersMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	csp := w.Header().Get("Content-Security-Policy")
	assert.NotEmpty(t, csp)
	assert.NotContains(t, csp, "'unsafe-eval'", "CSP must not contain 'unsafe-eval'")
	assert.Contains(t, csp, "script-src 'self' 'unsafe-inline' blob:;")
}

func TestMetricsAuthMiddleware_LoopbackBypass(t *testing.T) {
	r := gin.New()
	r.Use(MetricsAuthMiddleware("secret123", "production"))
	r.GET("/metrics", func(c *gin.Context) {
		c.String(http.StatusOK, "metrics_content")
	})

	// Localhost loopback request
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req.RemoteAddr = "127.0.0.1:45321"
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "metrics_content", w.Body.String())
}

func TestMetricsAuthMiddleware_ExternalBlockedInProduction(t *testing.T) {
	r := gin.New()
	r.Use(MetricsAuthMiddleware("secret123", "production"))
	r.GET("/metrics", func(c *gin.Context) {
		c.String(http.StatusOK, "metrics_content")
	})

	// External untrusted IP without token
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req.RemoteAddr = "203.0.113.195:45321"
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Must return 404 in production to keep metrics hidden from scanners
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestMetricsAuthMiddleware_ExternalAuthorizedWithBearerOrHeader(t *testing.T) {
	r := gin.New()
	r.Use(MetricsAuthMiddleware("secret123", "production"))
	r.GET("/metrics", func(c *gin.Context) {
		c.String(http.StatusOK, "metrics_content")
	})

	// Valid Bearer token
	reqBearer := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	reqBearer.RemoteAddr = "203.0.113.195:45321"
	reqBearer.Header.Set("Authorization", "Bearer secret123")
	wBearer := httptest.NewRecorder()
	r.ServeHTTP(wBearer, reqBearer)
	assert.Equal(t, http.StatusOK, wBearer.Code)

	// Valid X-Metrics-Token header
	reqCustom := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	reqCustom.RemoteAddr = "203.0.113.195:45321"
	reqCustom.Header.Set("X-Metrics-Token", "secret123")
	wCustom := httptest.NewRecorder()
	r.ServeHTTP(wCustom, reqCustom)
	assert.Equal(t, http.StatusOK, wCustom.Code)
}

func TestIsBotUserAgent(t *testing.T) {
	// Search engine bots
	assert.True(t, IsBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"))
	assert.True(t, IsBotUserAgent("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"))
	
	// Social media link preview crawlers
	assert.True(t, IsBotUserAgent("Twitterbot/1.0"))
	assert.True(t, IsBotUserAgent("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"))
	assert.True(t, IsBotUserAgent("Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)"))
	assert.True(t, IsBotUserAgent("TelegramBot (like TwitterBot)"))
	assert.True(t, IsBotUserAgent("WhatsApp/2.21.12.21 A"))

	// AI search bots (GEO)
	assert.True(t, IsBotUserAgent("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)"))
	assert.True(t, IsBotUserAgent("PerplexityBot/1.0 (+https://perplexity.ai/perplexitybot)"))
	assert.True(t, IsBotUserAgent("ClaudeBot/1.0; +claudebot@anthropic.com"))

	// Normal user browser agents (must NOT trigger bot rendering)
	assert.False(t, IsBotUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"))
	assert.False(t, IsBotUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"))
	assert.False(t, IsBotUserAgent(""))
}

func TestInjectTags(t *testing.T) {
	templateHTML := `<!doctype html>
<html>
<head>
<title>Default Title</title>
<meta name="description" content="Default Description" />
<link rel="canonical" href="https://lumiina.art/" />
<meta property="og:title" content="Default OG Title" />
<meta property="og:description" content="Default OG Description" />
<meta property="og:image" content="https://lumiina.art/mascot/bg2.png" />
<meta property="og:url" content="https://lumiina.art/" />
<meta property="og:type" content="website" />
<meta name="twitter:title" content="Default Twitter Title" />
<meta name="twitter:description" content="Default Twitter Description" />
<meta name="twitter:image" content="https://lumiina.art/mascot/bg2.png" />
</head>
<body><div id="root"></div></body>
</html>`

	injected := injectTags(
		templateHTML,
		"Cyberpunk Miku by kuro",
		"Stunning cyberpunk illustration of Hatsune Miku",
		"https://res.cloudinary.com/lumiina/image/upload/miku.jpg",
		"https://lumiina.art/artworks/Xk9L2m",
		"article",
	)

	assert.Contains(t, injected, "<title>Cyberpunk Miku by kuro</title>")
	assert.Contains(t, injected, `<meta name="description" content="Stunning cyberpunk illustration of Hatsune Miku" />`)
	assert.Contains(t, injected, `<link rel="canonical" href="https://lumiina.art/artworks/Xk9L2m" />`)
	assert.Contains(t, injected, `<meta property="og:title" content="Cyberpunk Miku by kuro" />`)
	assert.Contains(t, injected, `<meta property="og:image" content="https://res.cloudinary.com/lumiina/image/upload/miku.jpg" />`)
	assert.Contains(t, injected, `<meta property="og:url" content="https://lumiina.art/artworks/Xk9L2m" />`)
	assert.Contains(t, injected, `<meta property="og:type" content="article" />`)
}


