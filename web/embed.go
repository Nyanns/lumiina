package web

import (
	"embed"
	"io/fs"
	"net/http"
)

// DistFS embeds the entire production build of the React frontend
//
//go:embed all:dist
var DistFS embed.FS

// SubFS returns the filesystem rooted at dist/
func SubFS() (fs.FS, error) {
	return fs.Sub(DistFS, "dist")
}

// HTTPFS returns an http.FileSystem rooted at dist/ for standard file serving
func HTTPFS() (http.FileSystem, error) {
	sub, err := fs.Sub(DistFS, "dist")
	if err != nil {
		return nil, err
	}
	return http.FS(sub), nil
}
