package sanitize

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLog(t *testing.T) {
	input := "user\r\n[CRITICAL] Forged Log Entry\x00\x1b"
	expected := "user[CRITICAL] Forged Log Entry"
	assert.Equal(t, expected, Log(input))
}
