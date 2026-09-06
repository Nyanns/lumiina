-- 1. Index on comments(user_id) for user profile activity & moderation lookups
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
