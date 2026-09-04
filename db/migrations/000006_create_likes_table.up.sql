CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artwork_id INTEGER NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_artwork_like UNIQUE (user_id, artwork_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_artwork_id ON likes(artwork_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
