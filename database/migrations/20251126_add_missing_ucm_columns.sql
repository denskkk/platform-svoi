-- ========================================
-- Міграція: Додати відсутні колонки у ucm_transactions
-- Дата: 2025-11-26
-- Опис: Додає kind, related_entity_type, related_entity_id, meta
--       для підтримки нових версій схеми при збереженні 
--       сумісності зі старими даними
-- ========================================

-- Додати колонку kind (nullable спочатку)
ALTER TABLE ucm_transactions 
  ADD COLUMN IF NOT EXISTS kind VARCHAR(50);

-- Заповнити існуючі записи значенням за замовчуванням
UPDATE ucm_transactions 
SET kind = 'credit' 
WHERE kind IS NULL;

-- Додати колонку related_entity_type (nullable)
ALTER TABLE ucm_transactions 
  ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);

-- Додати колонку related_entity_id (nullable)
ALTER TABLE ucm_transactions 
  ADD COLUMN IF NOT EXISTS related_entity_id INTEGER;

-- Додати колонку meta (nullable JSONB)
ALTER TABLE ucm_transactions 
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';

-- Оновити існуючі записи з NULL meta на порожній об'єкт
UPDATE ucm_transactions 
SET meta = '{}' 
WHERE meta IS NULL;

-- Перевірка результату
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'ucm_transactions' 
-- ORDER BY ordinal_position;
