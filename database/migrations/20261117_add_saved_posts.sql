-- Збережені дописи (additive). Безпечно запускати повторно.
CREATE TABLE IF NOT EXISTS saved_posts (
  saved_post_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT saved_posts_user_post_key UNIQUE (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS saved_posts_user_created_idx ON saved_posts(user_id, created_at DESC);
