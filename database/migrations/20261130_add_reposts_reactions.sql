-- Репости та реакції (additive).
ALTER TABLE posts ADD COLUMN IF NOT EXISTS repost_of_id INTEGER REFERENCES posts(post_id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reposts_count INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS posts_repost_of_idx ON posts(repost_of_id);
ALTER TABLE post_likes ADD COLUMN IF NOT EXISTS reaction VARCHAR(10) NOT NULL DEFAULT 'like';
