-- 1. Enable pg_trgm extension for high-performance substring & fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN Trigram Indexes for fast ILIKE / LIKE searches
-- Drops query times on title & description from full table scan to sub-millisecond index scan
CREATE INDEX IF NOT EXISTS idx_artworks_title_trgm ON artworks USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_artworks_description_trgm ON artworks USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin (username gin_trgm_ops);

-- 3. B-Tree Indexes for Foreign Keys & Filtering
CREATE INDEX IF NOT EXISTS idx_artworks_user_id ON artworks(user_id);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at_desc ON artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artwork_tags_tag_id ON artwork_tags(tag_id);

-- 4. Composite Index for Comments (artwork feed + chronology)
CREATE INDEX IF NOT EXISTS idx_comments_artwork_created ON comments(artwork_id, created_at DESC);

-- 5. Partial Index for unverified users (optimizes cron cleanup and verification lookups)
CREATE INDEX IF NOT EXISTS idx_users_unverified ON users(created_at) WHERE is_verified = FALSE;
