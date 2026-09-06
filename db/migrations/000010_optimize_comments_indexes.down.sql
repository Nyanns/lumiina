-- Revert index on comments(user_id)
DROP INDEX IF EXISTS idx_comments_user_id;
