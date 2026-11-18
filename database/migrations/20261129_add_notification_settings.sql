-- Налаштування сповіщень (additive).
CREATE TABLE IF NOT EXISTS notification_settings (
  notification_setting_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  muted_groups VARCHAR(200) NOT NULL DEFAULT '',
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
