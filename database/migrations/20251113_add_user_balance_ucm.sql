-- Idempotent migration to add user balance column for internal currency «уцмка»
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='balance_ucm'
  ) THEN
    ALTER TABLE users ADD COLUMN balance_ucm NUMERIC(12,2) NOT NULL DEFAULT 0.00;
  END IF;
END $$;
