-- ========================================
-- Міграція: соціальна стрічка (пости, лайки, коментарі, підписки)
-- Дата: 2026-11-12
-- Тільки додає нові таблиці; існуючі таблиці та дані не змінюються.
-- Відкат: DROP TABLE follows, post_comments, post_likes, post_images, posts;
-- ========================================

CREATE TABLE IF NOT EXISTS posts (
  post_id        SERIAL PRIMARY KEY,
  author_id      INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  likes_count    INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  is_hidden      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS posts_author_id_created_at_idx ON posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_created_at_post_id_idx ON posts (created_at DESC, post_id DESC);

CREATE TABLE IF NOT EXISTS post_images (
  post_image_id SERIAL PRIMARY KEY,
  post_id       INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  url           VARCHAR(255) NOT NULL,
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS post_images_post_id_position_idx ON post_images (post_id, position);

CREATE TABLE IF NOT EXISTS post_likes (
  post_like_id SERIAL PRIMARY KEY,
  post_id      INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT post_likes_post_id_user_id_key UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx ON post_likes (user_id);

CREATE TABLE IF NOT EXISTS post_comments (
  post_comment_id SERIAL PRIMARY KEY,
  post_id         INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  author_id       INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content         VARCHAR(1000) NOT NULL,
  created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS post_comments_post_id_created_at_idx ON post_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS post_comments_author_id_idx ON post_comments (author_id);

CREATE TABLE IF NOT EXISTS follows (
  follow_id    SERIAL PRIMARY KEY,
  follower_id  INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT follows_follower_id_following_id_key UNIQUE (follower_id, following_id)
);
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows (following_id);
