package sanitize

import "strings"

// Log strips carriage returns, newlines, and control characters to prevent Log Injection / Log Forgery (CWE-117).
func Log(s string) string {
	s = strings.ReplaceAll(s, "\r", "")
	s = strings.ReplaceAll(s, "\n", "")
	return strings.Map(func(r rune) rune {
		if r < 32 || r == 127 {
			return -1
		}
		return r
	}, s)
}
