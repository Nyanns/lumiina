package model

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestArtwork_JSONMarshaling(t *testing.T) {
	art := Artwork{
		ID:    1,
		Title: "Twilight Horizon",
	}

	data, err := json.Marshal(art)
	require.NoError(t, err)

	// In JSON, id must be string e.g. "H1rJsY", not number 1
	var raw map[string]interface{}
	err = json.Unmarshal(data, &raw)
	require.NoError(t, err)

	assert.IsType(t, "", raw["id"], "Serialized ID should be a string")
	assert.Equal(t, "H1rJsY", raw["id"])

	// Unmarshal back to struct
	var restored Artwork
	err = json.Unmarshal(data, &restored)
	require.NoError(t, err)
	assert.Equal(t, uint(1), restored.ID)
}

func TestArtwork_SliceMarshaling(t *testing.T) {
	artworks := []Artwork{
		{ID: 1, Title: "Art 1"},
		{ID: 2, Title: "Art 2"},
	}

	data, err := json.Marshal(artworks)
	require.NoError(t, err)

	var rawList []map[string]interface{}
	err = json.Unmarshal(data, &rawList)
	require.NoError(t, err)

	assert.Equal(t, "H1rJsY", rawList[0]["id"])
	assert.Equal(t, "Wkyz19", rawList[1]["id"])
}
