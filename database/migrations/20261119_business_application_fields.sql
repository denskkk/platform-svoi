-- Розширена анкета бізнесу за ТЗ (additive). Безпечно запускати повторно.
ALTER TABLE business_applications ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE business_applications ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE business_applications ADD COLUMN IF NOT EXISTS work_hours VARCHAR(255);
ALTER TABLE business_applications ADD COLUMN IF NOT EXISTS social_links VARCHAR(500);
ALTER TABLE business_applications ADD COLUMN IF NOT EXISTS offerings VARCHAR(1000);
ALTER TABLE business_applications ADD COLUMN IF NOT EXISTS offered_reward_percent NUMERIC(5,2);
ALTER TABLE business_applications ADD COLUMN IF NOT EXISTS offered_reward_terms VARCHAR(300);
