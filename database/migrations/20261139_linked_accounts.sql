-- Зв'язані акаунти (особистий ↔ бізнес), additive
CREATE TABLE IF NOT EXISTS linked_accounts (
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  linked_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, linked_user_id)
);
