package hashid

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHashID_EncodeDecode(t *testing.T) {
	testIDs := []uint{1, 2, 42, 100, 99999, 149011628}

	t.Logf("ID 1 -> %s, ID 2 -> %s, ID 100 -> %s", Encode(1), Encode(2), Encode(100))
	for _, id := range testIDs {
		t.Run("ID_"+string(rune(id)), func(t *testing.T) {
			slug := Encode(id)
			assert.NotEmpty(t, slug)
			assert.GreaterOrEqual(t, len(slug), 6, "Slug should be at least 6 characters")

			decoded, err := Decode(slug)
			require.NoError(t, err)
			assert.Equal(t, id, decoded)
		})
	}
}

func TestHashID_BackwardCompatibility(t *testing.T) {
	// Numeric string should decode cleanly
	id, err := Decode("1")
	require.NoError(t, err)
	assert.Equal(t, uint(1), id)

	id, err = Decode("42")
	require.NoError(t, err)
	assert.Equal(t, uint(42), id)
}

func TestHashID_InvalidInput(t *testing.T) {
	_, err := Decode("")
	assert.Error(t, err)

	_, err = Decode("---invalid---")
	assert.Error(t, err)
}

func TestHashID_Uniqueness(t *testing.T) {
	seen := make(map[string]bool)
	for i := uint(1); i <= 500; i++ {
		slug := Encode(i)
		assert.False(t, seen[slug], "Slug collision detected for ID %d: %s", i, slug)
		seen[slug] = true
	}
}
