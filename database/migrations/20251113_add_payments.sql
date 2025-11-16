-- Idempotent migration for payments table

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'payments'
  ) THEN
    CREATE TABLE payments (
      payment_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      provider VARCHAR(50) NOT NULL DEFAULT 'wayforpay',
      order_reference VARCHAR(100) NOT NULL UNIQUE,
      amount NUMERIC(12,2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'UAH',
      description TEXT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'new',
      invoice_url VARCHAR(255) NULL,
      raw_request JSONB NULL,
      raw_response JSONB NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- FK to users
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name='payments' AND constraint_name='payments_user_id_fkey'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename='payments' AND indexname='payments_user_id_idx'
  ) THEN
    CREATE INDEX payments_user_id_idx ON payments(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename='payments' AND indexname='payments_status_idx'
  ) THEN
    CREATE INDEX payments_status_idx ON payments(status);
  END IF;
END $$;
