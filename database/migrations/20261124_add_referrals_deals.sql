-- Реферальні програми та угоди (additive). Безпечно запускати повторно. Гроші системою не рухаються.
CREATE TABLE IF NOT EXISTS referral_programs (
  referral_program_id SERIAL PRIMARY KEY,
  business_user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  percent NUMERIC(5,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  contract_ref VARCHAR(100),
  activated_by_id INTEGER,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS referral_programs_status_idx ON referral_programs(status);
CREATE TABLE IF NOT EXISTS deals (
  deal_id SERIAL PRIMARY KEY,
  business_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  referrer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  customer_name VARCHAR(120),
  customer_contact VARCHAR(100),
  note VARCHAR(300),
  source VARCHAR(10) NOT NULL DEFAULT 'lead',
  status VARCHAR(20) NOT NULL DEFAULT 'lead_created',
  percent NUMERIC(5,2) NOT NULL,
  amount NUMERIC(14,2),
  commission NUMERIC(14,2),
  currency VARCHAR(3) NOT NULL DEFAULT 'UAH',
  status_before_dispute VARCHAR(20),
  dispute_reason VARCHAR(500),
  confirmed_at TIMESTAMP(3),
  accrued_at TIMESTAMP(3),
  paid_out_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS deals_business_status_idx ON deals(business_user_id, status);
CREATE INDEX IF NOT EXISTS deals_referrer_status_idx ON deals(referrer_id, status);
CREATE INDEX IF NOT EXISTS deals_customer_idx ON deals(customer_id);
CREATE INDEX IF NOT EXISTS deals_status_created_idx ON deals(status, created_at);
-- Один клієнт-користувач не може бути приведений до однієї компанії двічі (поки угода не відхилена)
CREATE UNIQUE INDEX IF NOT EXISTS deals_unique_active_customer_idx ON deals(business_user_id, customer_id) WHERE customer_id IS NOT NULL AND status <> 'rejected';
