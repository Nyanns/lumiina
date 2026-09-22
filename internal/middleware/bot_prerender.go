package middleware

import (
	"fmt"
	"html"
	"regexp"
	"strings"

	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/pkg/hashid"
	"gorm.io/gorm"
)

var botUserAgentRegex = regexp.MustCompile(`(?i)(googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkshare|w3c_validator|whatsapp|discordbot|telegrambot|applebot|duckduckbot|gptbot|perplexitybot|claudebot)`)

var (
	titleRegex       = regexp.MustCompile(`(?i)<title>.*?</title>`)
	descRegex        = regexp.MustCompile(`(?i)<meta\s+name="description"\s+content=".*?"\s*/?>`)
	canonicalRegex   = regexp.MustCompile(`(?i)<link\s+rel="canonical"\s+href=".*?"\s*/?>`)
	ogTitleRegex     = regexp.MustCompile(`(?i)<meta\s+property="og:title"\s+content=".*?"\s*/?>`)
	ogDescRegex      = regexp.MustCompile(`(?i)<meta\s+property="og:description"\s+content=".*?"\s*/?>`)
	ogImageRegex     = regexp.MustCompile(`(?i)<meta\s+property="og:image"\s+content=".*?"\s*/?>`)
	ogURLRegex       = regexp.MustCompile(`(?i)<meta\s+property="og:url"\s+content=".*?"\s*/?>`)
	ogTypeRegex      = regexp.MustCompile(`(?i)<meta\s+property="og:type"\s+content=".*?"\s*/?>`)
	twitterTitleReg  = regexp.MustCompile(`(?i)<meta\s+name="twitter:title"\s+content=".*?"\s*/?>`)
	twitterDescReg   = regexp.MustCompile(`(?i)<meta\s+name="twitter:description"\s+content=".*?"\s*/?>`)
	twitterImageReg  = regexp.MustCompile(`(?i)<meta\s+name="twitter:image"\s+content=".*?"\s*/?>`)
)

// IsBotUserAgent returns true if the User-Agent matches any known search engine or social media crawler.
func IsBotUserAgent(userAgent string) bool {
	if userAgent == "" {
		return false
	}
	return botUserAgentRegex.MatchString(userAgent)
}

func injectTags(htmlStr, title, desc, imageURL, canonicalURL, ogType string) string {
	cleanTitle := html.EscapeString(title)
	cleanDesc := html.EscapeString(desc)
	cleanImage := html.EscapeString(imageURL)
	cleanCanonical := html.EscapeString(canonicalURL)

	res := htmlStr
	res = titleRegex.ReplaceAllString(res, fmt.Sprintf("<title>%s</title>", cleanTitle))
	res = descRegex.ReplaceAllString(res, fmt.Sprintf(`<meta name="description" content="%s" />`, cleanDesc))
	res = canonicalRegex.ReplaceAllString(res, fmt.Sprintf(`<link rel="canonical" href="%s" />`, cleanCanonical))
	res = ogTitleRegex.ReplaceAllString(res, fmt.Sprintf(`<meta property="og:title" content="%s" />`, cleanTitle))
	res = ogDescRegex.ReplaceAllString(res, fmt.Sprintf(`<meta property="og:description" content="%s" />`, cleanDesc))
	res = ogImageRegex.ReplaceAllString(res, fmt.Sprintf(`<meta property="og:image" content="%s" />`, cleanImage))
	res = ogURLRegex.ReplaceAllString(res, fmt.Sprintf(`<meta property="og:url" content="%s" />`, cleanCanonical))
	res = ogTypeRegex.ReplaceAllString(res, fmt.Sprintf(`<meta property="og:type" content="%s" />`, ogType))
	res = twitterTitleReg.ReplaceAllString(res, fmt.Sprintf(`<meta name="twitter:title" content="%s" />`, cleanTitle))
	res = twitterDescReg.ReplaceAllString(res, fmt.Sprintf(`<meta name="twitter:description" content="%s" />`, cleanDesc))
	res = twitterImageReg.ReplaceAllString(res, fmt.Sprintf(`<meta name="twitter:image" content="%s" />`, cleanImage))

	return res
}

// PreRenderMetadata injects dynamic Title, Open Graph, Twitter Cards, and canonical tags into the embedded index.html
// when visited by Googlebot or social media crawlers.
func PreRenderMetadata(db *gorm.DB, rawHTML []byte, reqPath, baseURL string) []byte {
	if db == nil || len(rawHTML) == 0 {
		return rawHTML
	}

	htmlStr := string(rawHTML)
	cleanBase := strings.TrimRight(baseURL, "/")
	if cleanBase == "" {
		cleanBase = "https://lumiina.art"
	}

	cleanPath := strings.TrimPrefix(reqPath, "/")

	// 1. Artwork Route: artworks/:id
	if strings.HasPrefix(cleanPath, "artworks/") {
		slug := strings.TrimPrefix(cleanPath, "artworks/")
		slug = strings.Split(slug, "/")[0]
		slug = strings.TrimSpace(slug)
		if slug != "" {
			artworkID, err := hashid.Decode(slug)
			if err == nil && artworkID > 0 {
				var art model.Artwork
				if dbErr := db.Preload("User").First(&art, artworkID).Error; dbErr == nil {
					artistName := art.User.DisplayName
					if artistName == "" {
						artistName = art.User.Username
					}
					if artistName == "" {
						artistName = "Artist"
					}

					title := fmt.Sprintf("%s by %s — Lumiina", art.Title, artistName)
					desc := art.Description
					if desc == "" {
						desc = fmt.Sprintf("Discover %s by %s on Lumiina — Authentic anime fan art and digital illustrations.", art.Title, artistName)
					}
					canonicalURL := fmt.Sprintf("%s/artworks/%s", cleanBase, slug)

					return []byte(injectTags(htmlStr, title, desc, art.ImageURL, canonicalURL, "article"))
				}
			}
		}
	}

	// 2. Profile Route: profile/:username
	if strings.HasPrefix(cleanPath, "profile/") {
		username := strings.TrimPrefix(cleanPath, "profile/")
		username = strings.Split(username, "/")[0]
		username = strings.TrimSpace(username)
		if username != "" {
			var user model.User
			if dbErr := db.Where("LOWER(username) = ?", strings.ToLower(username)).First(&user).Error; dbErr == nil {
				displayName := user.DisplayName
				if displayName == "" {
					displayName = user.Username
				}
				title := fmt.Sprintf("%s (@%s) — Lumiina Artist Portfolio", displayName, user.Username)
				desc := user.Bio
				if desc == "" {
					desc = fmt.Sprintf("Explore illustrations and digital fan art by %s on Lumiina.", displayName)
				}
				imageURL := user.AvatarURL
				if imageURL == "" {
					imageURL = cleanBase + "/mascot/bg2.png"
				}
				canonicalURL := fmt.Sprintf("%s/profile/%s", cleanBase, user.Username)

				return []byte(injectTags(htmlStr, title, desc, imageURL, canonicalURL, "profile"))
			}
		}
	}

	return rawHTML
}
