-- Відео до дописів (additive). Безпечно запускати повторно.
CREATE TABLE IF NOT EXISTS post_videos (
  post_video_id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  post_id INTEGER UNIQUE REFERENCES posts(post_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  raw_name VARCHAR(80),
  url VARCHAR(255),
  poster_url VARCHAR(255),
  duration_sec INTEGER,
  size_bytes INTEGER,
  error VARCHAR(120),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS post_videos_status_created_idx ON post_videos(status, created_at);
CREATE INDEX IF NOT EXISTS post_videos_owner_created_idx ON post_videos(owner_id, created_at);
