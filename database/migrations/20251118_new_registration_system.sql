-- Міграція: Нова система реєстрації з платними функціями
-- Дата: 2025-11-18
-- Опис: Залишаємо тільки 3 типи акаунтів (viewer, basic, business),
--        додаємо платні дії та покращуємо реферальну систему

-- ========================================
-- 1. Оновлюємо enum AccountType
-- ========================================

-- Створюємо новий enum
CREATE TYPE "AccountType_new" AS ENUM ('viewer', 'basic', 'business');

-- Оновлюємо існуючі записи
-- guest -> viewer (тільки перегляд)
-- extended -> basic (звичайний з платними функціями)
-- business_premium -> business (бізнес з платними функціями)
UPDATE users 
SET account_type = 
  CASE 
    WHEN account_type = 'guest' THEN 'viewer'::text
    WHEN account_type = 'extended' THEN 'basic'::text
    WHEN account_type = 'business_premium' THEN 'business'::text
    ELSE account_type::text
  END::text;

-- Видаляємо старий enum та перейменовуємо новий
ALTER TABLE users ALTER COLUMN account_type TYPE "AccountType_new" USING account_type::text::"AccountType_new";
DROP TYPE "AccountType";
ALTER TYPE "AccountType_new" RENAME TO "AccountType";

-- ========================================
-- 2. Додаємо новий enum для платних дій
-- ========================================

CREATE TYPE "PaidActionType" AS ENUM (
  'partner_search',     -- Пошук пари/партнера - 5 уцмок
  'job_request',        -- Заявка на пошук роботи - 3 уцмки
  'service_request',    -- Заявка на послугу - 3 уцмки
  'employee_search',    -- Пошук працівника - 4 уцмки
  'investor_search',    -- Пошук інвестора - 5 уцмок
  'advanced_search'     -- Розширений пошук - 2 уцмки
);

-- ========================================
-- 3. Створюємо таблицю платних дій
-- ========================================

CREATE TABLE IF NOT EXISTS paid_actions (
  paid_action_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  action_type "PaidActionType" NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id INTEGER,
  description TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_paid_action_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Індекси для швидкого пошуку
CREATE INDEX idx_paid_actions_user_date ON paid_actions(user_id, created_at DESC);
CREATE INDEX idx_paid_actions_type ON paid_actions(action_type);
CREATE INDEX idx_paid_actions_success ON paid_actions(success);

-- ========================================
-- 4. Оновлюємо реферальні бонуси
-- ========================================

-- Оновлюємо значення бонусів для всіх рефералів (стандартизуємо до 1 уцмки)
UPDATE referrals SET bonus_inviter = 1.00, bonus_invitee = 1.00;

-- ========================================
-- 5. Оновлюємо підписки (subscription)
-- ========================================

-- Видаляємо активні платні підписки, тепер всі функції платні за використання
UPDATE users 
SET subscription_active = false,
    subscription_expires_at = NULL
WHERE account_type IN ('basic', 'business');

-- ========================================
-- 6. Коментарі до таблиць
-- ========================================

COMMENT ON TABLE paid_actions IS 'Лог платних дій користувачів (пошук пари, заявки тощо)';
COMMENT ON COLUMN paid_actions.action_type IS 'Тип платної дії';
COMMENT ON COLUMN paid_actions.amount IS 'Сума списання в уцмках';
COMMENT ON COLUMN paid_actions.success IS 'Чи успішно виконано дію';

-- ========================================
-- 7. Надаємо початковий баланс новим користувачам
-- ========================================

-- Для тестування: додаємо 5 уцмок всім існуючим користувачам
-- В продакшені цей рядок можна пропустити
UPDATE users SET balance_ucm = balance_ucm + 5.00 WHERE balance_ucm = 0;

-- ========================================
-- ЗАВЕРШЕНО
-- ========================================

-- Перевірка
SELECT 
  'AccountType enum' as check_name,
  COUNT(*) as count,
  string_agg(DISTINCT account_type::text, ', ') as types
FROM users
UNION ALL
SELECT 
  'Paid actions table' as check_name,
  COUNT(*) as count,
  'created' as types
FROM paid_actions;
