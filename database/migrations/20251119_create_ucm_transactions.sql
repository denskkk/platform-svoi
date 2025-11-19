-- Idempotent migration for UCM transactions ledger

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'ucm_transactions'
  ) THEN
    CREATE TABLE ucm_transactions (
      tx_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      kind VARCHAR(50) NOT NULL DEFAULT 'credit',
      amount NUMERIC(12,2) NOT NULL,
      reason VARCHAR(50) NOT NULL,
      related_entity_type VARCHAR(50) NULL,
      related_entity_id INTEGER NULL,
      meta JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Foreign key to users
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name='ucm_transactions' AND constraint_name='ucm_transactions_user_id_fkey'
  ) THEN
    ALTER TABLE ucm_transactions
      ADD CONSTRAINT ucm_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename='ucm_transactions' AND indexname='ucm_tx_user_created_at_idx'
  ) THEN
    CREATE INDEX ucm_tx_user_created_at_idx ON ucm_transactions(user_id, created_at DESC);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename='ucm_transactions' AND indexname='ucm_tx_reason_idx'
  ) THEN
    CREATE INDEX ucm_tx_reason_idx ON ucm_transactions(reason);
  END IF;
END $$;
