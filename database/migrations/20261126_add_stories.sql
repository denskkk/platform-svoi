-- Історії (additive, 24 години). Безпечно запускати повторно.
CREATE TABLE IF NOT EXISTS stories (
  story_id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  media_type VARCHAR(10) NOT NULL,
  media_url VARCHAR(255) NOT NULL,
  poster_url VARCHAR(255),
  video_id INTEGER UNIQUE REFERENCES post_videos(post_video_id) ON DELETE SET NULL,
  caption VARCHAR(200),
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS stories_owner_expires_idx ON stories(owner_id, expires_at);
CREATE INDEX IF NOT EXISTS stories_expires_idx ON stories(expires_at);
CREATE TABLE IF NOT EXISTS story_views (
  story_view_id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (story_id, user_id)
);
