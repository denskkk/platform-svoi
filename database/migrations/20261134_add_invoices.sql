-- Рахунки між користувачами (additive). Система лише веде облік і статуси; оплата відбувається поза системою.
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id  SERIAL PRIMARY KEY,
  issuer_id   INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  payer_id    INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency    VARCHAR(3) NOT NULL DEFAULT 'UAH',
  description VARCHAR(500) NOT NULL,
  status      VARCHAR(16) NOT NULL DEFAULT 'issued',
  due_at      TIMESTAMP(3),
  paid_at     TIMESTAMP(3),
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS invoices_issuer_idx ON invoices (issuer_id, status, invoice_id DESC);
CREATE INDEX IF NOT EXISTS invoices_payer_idx ON invoices (payer_id, status, invoice_id DESC);
