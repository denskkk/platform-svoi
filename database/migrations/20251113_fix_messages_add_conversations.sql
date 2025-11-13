-- Idempotent migration to align existing messages table with new conversations-based schema
-- Safe to run multiple times

BEGIN;

-- 1) Ensure conversations table exists
CREATE TABLE IF NOT EXISTS conversations (
  conversation_id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL,
  user2_id INTEGER NOT NULL,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- unique pair index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'conversations_user1_id_user2_id_key'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX conversations_user1_id_user2_id_key ON conversations(user1_id, user2_id)';
  END IF;
END$$;

-- 2) Ensure messages table has required columns
-- Add conversation_id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'conversation_id'
  ) THEN
    EXECUTE 'ALTER TABLE messages ADD COLUMN conversation_id INTEGER';
  END IF;
END$$;

-- Add content column or rename old text -> content
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'content'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'messages' AND column_name = 'text'
    ) THEN
      -- rename text -> content
      EXECUTE 'ALTER TABLE messages RENAME COLUMN text TO content';
    ELSE
      -- create content column if neither exists
      EXECUTE 'ALTER TABLE messages ADD COLUMN content TEXT';
    END IF;
  END IF;
END$$;

-- Ensure updated_at column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE messages ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP';
  END IF;
END$$;

-- 3) Backfill conversations and link messages
-- Insert missing conversation rows for each user pair present in messages
WITH pairs AS (
  SELECT DISTINCT LEAST(sender_id, receiver_id) AS user1_id,
                  GREATEST(sender_id, receiver_id) AS user2_id
  FROM messages
)
INSERT INTO conversations (user1_id, user2_id, last_message_at, created_at, updated_at)
SELECT p.user1_id, p.user2_id, NOW(), NOW(), NOW()
FROM pairs p
ON CONFLICT (user1_id, user2_id) DO NOTHING;

-- Update messages.conversation_id by joining to conversations on user pair
UPDATE messages m
SET conversation_id = c.conversation_id
FROM conversations c
WHERE m.conversation_id IS NULL
  AND LEAST(m.sender_id, m.receiver_id) = c.user1_id
  AND GREATEST(m.sender_id, m.receiver_id) = c.user2_id;

-- 4) Add indexes and FKs if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversation_id_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE messages
             ADD CONSTRAINT messages_conversation_id_fkey
             FOREIGN KEY (conversation_id)
             REFERENCES conversations(conversation_id)
             ON DELETE CASCADE ON UPDATE CASCADE';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'messages_conversation_id_idx'
  ) THEN
    EXECUTE 'CREATE INDEX messages_conversation_id_idx ON messages(conversation_id)';
  END IF;
END$$;

-- 5) Try to enforce NOT NULL on conversation_id if all rows are populated
DO $$
DECLARE cnt_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt_missing FROM messages WHERE conversation_id IS NULL;
  IF cnt_missing = 0 THEN
    BEGIN
      EXECUTE 'ALTER TABLE messages ALTER COLUMN conversation_id SET NOT NULL';
    EXCEPTION WHEN others THEN
      -- ignore if cannot set not null (older postgres etc.)
    END;
  END IF;
END$$;

COMMIT;
