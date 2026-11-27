-- «Видалити чат у себе»: кожен учасник приховує історію особисто, співрозмовник її не втрачає. Additive.
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user1_cleared_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user2_cleared_at TIMESTAMPTZ;
