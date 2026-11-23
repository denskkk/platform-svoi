-- Відповіді на коментарі та лайки коментарів (additive). Безпечно запускати повторно.
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES post_comments(post_comment_id) ON DELETE CASCADE;
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS post_comments_parent_id_idx ON post_comments(parent_id);
CREATE TABLE IF NOT EXISTS post_comment_likes (
  post_comment_like_id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES post_comments(post_comment_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT post_comment_likes_comment_user_key UNIQUE (comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS post_comment_likes_user_id_idx ON post_comment_likes(user_id);
