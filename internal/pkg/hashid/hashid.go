package hashid

import (
	"errors"
	"strconv"
	"unicode"

	"github.com/sqids/sqids-go"
)

var sq *sqids.Sqids

func init() {
	var err error
	// MinLength 6 creates elegant ArtStation-like short slugs (e.g. "Xk9L2m")
	// Shuffled alphanumeric alphabet acts as the deterministic salt
	sq, err = sqids.New(sqids.Options{
		MinLength: 6,
		Alphabet:  "k3m8p9q2r5s7t1v4w6x0yzaBCDFGHJKLMNPQRSTVWXYZ",
	})
	if err != nil {
		panic("failed to initialize sqids: " + err.Error())
	}
}

// IsAllDigits checks if the string contains only numeric digits 0-9
func IsAllDigits(s string) bool {
	if len(s) == 0 {
		return false
	}
	for _, r := range s {
		if !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}

func isAllDigits(s string) bool {
	return IsAllDigits(s)
}

// Encode converts a database uint ID (e.g. 1) to an obfuscated slug (e.g. "Xk9L2m")
func Encode(id uint) string {
	if id == 0 {
		return ""
	}
	res, err := sq.Encode([]uint64{uint64(id)})
	if err != nil {
		return ""
	}
	return res
}

// Decode converts an obfuscated slug back to a uint ID.
// If the string is purely digits (e.g. "1", "42") or length < 6, it treats it as a raw integer ID
// for seamless backward compatibility with legacy API clients, tests, and bookmarks.
func Decode(hashOrID string) (uint, error) {
	if hashOrID == "" {
		return 0, errors.New("empty id")
	}

	// Backward compatibility: If it's a pure numeric string (e.g. "1", "42", "100")
	if isAllDigits(hashOrID) {
		if num, err := strconv.ParseUint(hashOrID, 10, 64); err == nil && num > 0 {
			return uint(num), nil
		}
	}

	// Decode via Sqids
	numbers := sq.Decode(hashOrID)
	if len(numbers) > 0 && numbers[0] > 0 {
		return uint(numbers[0]), nil
	}

	return 0, errors.New("invalid artwork id format")
}
