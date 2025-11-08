-- Міграція: Додавання полів для розширеного профілю
-- Дата: 2025-11-08

-- Змінюємо тип полів УЦМ з boolean на varchar
ALTER TABLE users 
  ALTER COLUMN ucm_member TYPE VARCHAR(50),
  ALTER COLUMN ucm_supporter TYPE VARCHAR(50);

-- Змінюємо тип поля usesDelivery з boolean на varchar
ALTER TABLE users 
  ALTER COLUMN uses_delivery TYPE VARCHAR(50);

-- Змінюємо тип поля readyToSwitchToUCM з boolean на varchar  
ALTER TABLE users
  ALTER COLUMN ready_to_switch_ucm TYPE VARCHAR(50);

-- Додаємо нові поля для розширеного профілю

-- Робота та освіта
ALTER TABLE users ADD COLUMN IF NOT EXISTS seeking_specialty VARCHAR(200);

-- Бізнес інформація
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS fop_group VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tov_type VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_code VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_category VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS offer_type VARCHAR(50);

-- Сімейні дані
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_children VARCHAR(50);

-- Транспорт
ALTER TABLE users ADD COLUMN IF NOT EXISTS uses_taxi BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_bicycle VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bicycle_info VARCHAR(200);

-- Домашні сервіси
ALTER TABLE users ADD COLUMN IF NOT EXISTS uses_home_services JSONB DEFAULT '[]';

-- Мета використання сайту
ALTER TABLE users ADD COLUMN IF NOT EXISTS site_usage_goal JSONB DEFAULT '[]';

-- Коментар для інформації
COMMENT ON COLUMN users.seeking_specialty IS 'Спеціальність, яку шукає користувач';
COMMENT ON COLUMN users.business_type IS 'Тип бізнесу: ФОП/ТОВ/інше';
COMMENT ON COLUMN users.fop_group IS 'Група ФОП: 1/2/3';
COMMENT ON COLUMN users.tov_type IS 'Тип ТОВ';
COMMENT ON COLUMN users.company_code IS 'Код ЄДРПОУ';
COMMENT ON COLUMN users.business_category IS 'Категорія бізнесу';
COMMENT ON COLUMN users.offer_type IS 'Що пропонує: послуга/товар/обидва';
COMMENT ON COLUMN users.has_children IS 'Наявність дітей: так/ні/плануємо';
COMMENT ON COLUMN users.uses_taxi IS 'Користується таксі';
COMMENT ON COLUMN users.has_bicycle IS 'Наявність велосипеда: так/ні/плануємо';
COMMENT ON COLUMN users.bicycle_info IS 'Інформація про велосипед';
COMMENT ON COLUMN users.uses_home_services IS 'Масив домашніх сервісів, якими користується';
COMMENT ON COLUMN users.site_usage_goal IS 'Масив цілей використання платформи';
COMMENT ON COLUMN users.ucm_member IS 'Учасник УЦМ: так/ні/цікаво';
COMMENT ON COLUMN users.ucm_supporter IS 'Підтримує УЦМ: так/ні/цікаво';
COMMENT ON COLUMN users.uses_delivery IS 'Користується доставкою: так/ні/іноді';
COMMENT ON COLUMN users.ready_to_switch_ucm IS 'Готовий перейти на спеціалістів УЦМ: так/ні/цікаво';
