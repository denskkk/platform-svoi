-- Видалення внутрішньої валюти («уцмки») та всього, що з нею пов'язано.
-- Міграція ідемпотентна: її можна запускати повторно без помилок.
-- ВАЖЛИВО: міграція видаляє дані (баланси, історію транзакцій, рефералів, платежі).
-- Перед запуском зробіть резервну копію бази даних.

BEGIN;

-- 1. Значок «Перевірено УЦМ» перетворюємо на загальний статус «Перевірений» (users.is_verified)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'ucm_verified'
  ) THEN
    EXECUTE 'UPDATE users SET is_verified = TRUE WHERE ucm_verified = TRUE';
  END IF;
END $$;

-- 2. Ціни послуг у «УЦМ» -> гривні
UPDATE services
SET price_unit = replace(replace(price_unit, 'УЦМ', 'грн'), 'уцм', 'грн')
WHERE price_unit ILIKE '%уцм%';

-- 3. Старі сповіщення з сумами в «УЦМ» -> гривні
UPDATE notifications
SET message = replace(replace(message, 'УЦМ', 'грн'), 'уцм', 'грн')
WHERE message ILIKE '%уцм%';

-- 4. Таблиці
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS paid_actions CASCADE;
DROP TABLE IF EXISTS ucm_transactions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;

-- 5. Колонки користувачів
ALTER TABLE users DROP COLUMN IF EXISTS ucm_member;
ALTER TABLE users DROP COLUMN IF EXISTS ucm_supporter;
ALTER TABLE users DROP COLUMN IF EXISTS ready_to_switch_ucm;
ALTER TABLE users DROP COLUMN IF EXISTS ucm_verified;
ALTER TABLE users DROP COLUMN IF EXISTS balance_ucm;
ALTER TABLE users DROP COLUMN IF EXISTS referral_code;
ALTER TABLE users DROP COLUMN IF EXISTS referred_by_id;

-- 6. Бізнес-профілі
ALTER TABLE business_info DROP COLUMN IF EXISTS wants_ucm_analysis;

-- 7. Заявки (requests)
ALTER TABLE requests DROP COLUMN IF EXISTS is_paid;
ALTER TABLE requests DROP COLUMN IF EXISTS price_ucm;
ALTER TABLE requests DROP COLUMN IF EXISTS promoted;

-- 8. Заявки на послуги (service_requests)
ALTER TABLE service_requests DROP COLUMN IF EXISTS price_ucm;
ALTER TABLE service_requests DROP COLUMN IF EXISTS is_paid;
ALTER TABLE service_requests DROP COLUMN IF EXISTS is_promoted;
ALTER TABLE service_requests DROP COLUMN IF EXISTS promoted_until;
ALTER TABLE service_requests DROP COLUMN IF EXISTS paid_at;

-- 9. Типи (enum)
DROP TYPE IF EXISTS "PaidActionType";
DROP TYPE IF EXISTS "UcmTransactionKind";

COMMIT;
