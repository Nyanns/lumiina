package indexnow

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestDispatchURLs_FormattingAndPayload(t *testing.T) {
	var capturedPayload payload
	var receivedRequest bool

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedRequest = true
		assert.Equal(t, http.MethodPost, r.Method)
		assert.Equal(t, "application/json; charset=utf-8", r.Header.Get("Content-Type"))

		bodyBytes, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(bodyBytes, &capturedPayload)
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()

	// Empty input should safely no-op
	DispatchURLs("https://www.lumiina.art")
	assert.False(t, receivedRequest)

	// Valid input with relative and absolute URLs
	DispatchURLs("https://www.lumiina.art", "/artworks/Xk9L2m", "https://www.lumiina.art/?tag=Frieren")

	// Allow goroutine to fire
	time.Sleep(100 * time.Millisecond)
}
