-- Групові чати (additive)
CREATE TABLE IF NOT EXISTS group_chats (
  group_chat_id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS group_chats_last_idx ON group_chats (last_message_at);
CREATE TABLE IF NOT EXISTS group_chat_members (
  group_chat_id INTEGER NOT NULL REFERENCES group_chats(group_chat_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  last_read_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  joined_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_chat_id, user_id)
);
CREATE INDEX IF NOT EXISTS group_chat_members_user_idx ON group_chat_members (user_id);
CREATE TABLE IF NOT EXISTS group_messages (
  group_message_id SERIAL PRIMARY KEY,
  group_chat_id INTEGER NOT NULL REFERENCES group_chats(group_chat_id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS group_messages_chat_idx ON group_messages (group_chat_id, group_message_id DESC);
