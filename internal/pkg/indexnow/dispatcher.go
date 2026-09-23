package indexnow

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	IndexNowAPIURL   = "https://api.indexnow.org/indexnow"
	DefaultKey       = "e479a9528646452292f9d554a7f92e91"
	DefaultKeyFile   = "e479a9528646452292f9d554a7f92e91.txt"
	DefaultBaseURL   = "https://www.lumiina.art"
)

type payload struct {
	Host        string   `json:"host"`
	Key         string   `json:"key"`
	KeyLocation string   `json:"keyLocation"`
	URLList     []string `json:"urlList"`
}

// DispatchURLs sends an asynchronous notification to Microsoft Bing, Yandex, and partner engines
// via the IndexNow protocol whenever new artwork, tag, or profile content is published.
func DispatchURLs(baseURL string, rawURLs ...string) {
	if len(rawURLs) == 0 {
		return
	}

	cleanBase := strings.TrimRight(baseURL, "/")
	if cleanBase == "" {
		cleanBase = DefaultBaseURL
	}

	parsedBase, err := url.Parse(cleanBase)
	if err != nil || parsedBase.Host == "" {
		parsedBase, _ = url.Parse(DefaultBaseURL)
	}
	host := parsedBase.Host

	var validURLs []string
	for _, u := range rawURLs {
		trimmed := strings.TrimSpace(u)
		if trimmed == "" {
			continue
		}
		if !strings.HasPrefix(trimmed, "http://") && !strings.HasPrefix(trimmed, "https://") {
			trimmed = fmt.Sprintf("%s/%s", cleanBase, strings.TrimPrefix(trimmed, "/"))
		}
		validURLs = append(validURLs, trimmed)
	}

	if len(validURLs) == 0 {
		return
	}

	// Fire in a non-blocking background goroutine with bounded context
	go func(h string, urls []string) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		body := payload{
			Host:        h,
			Key:         DefaultKey,
			KeyLocation: fmt.Sprintf("https://%s/%s", h, DefaultKeyFile),
			URLList:     urls,
		}

		jsonBytes, marshalErr := json.Marshal(body)
		if marshalErr != nil {
			slog.Warn("IndexNow: failed to marshal payload", "error", marshalErr)
			return
		}

		req, reqErr := http.NewRequestWithContext(ctx, http.MethodPost, IndexNowAPIURL, bytes.NewReader(jsonBytes))
		if reqErr != nil {
			slog.Warn("IndexNow: failed to construct request", "error", reqErr)
			return
		}
		req.Header.Set("Content-Type", "application/json; charset=utf-8")

		client := &http.Client{Timeout: 5 * time.Second}
		resp, postErr := client.Do(req)
		if postErr != nil {
			slog.Debug("IndexNow: dispatch network call failed (non-critical)", "error", postErr)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusAccepted {
			slog.Info("IndexNow: successfully dispatched URLs to search engines", "count", len(urls), "status", resp.StatusCode)
		} else {
			slog.Warn("IndexNow: unexpected response status", "status", resp.StatusCode)
		}
	}(host, validURLs)
}
