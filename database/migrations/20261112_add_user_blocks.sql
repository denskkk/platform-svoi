-- Блокування користувачів. Тільки нова таблиця, існуючі не змінюються.
-- Відкат: DROP TABLE user_blocks;
CREATE TABLE IF NOT EXISTS user_blocks (
  block_id   SERIAL PRIMARY KEY,
  blocker_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_blocks_blocker_id_blocked_id_key UNIQUE (blocker_id, blocked_id)
);
CREATE INDEX IF NOT EXISTS user_blocks_blocker_id_idx ON user_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_id_idx ON user_blocks (blocked_id);
