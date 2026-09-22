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

