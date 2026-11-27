-- Дата згоди з Умовами використання та Політикою конфіденційності (фіксується при реєстрації). Additive.
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
