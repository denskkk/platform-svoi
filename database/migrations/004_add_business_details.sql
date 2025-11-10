-- Migration: Add detailed business search fields and banner
-- Date: 2025-11-10
-- Description: Добавляет детальные поля для поиска партнеров, инвесторов, клиентов, вакансий и банер компании

-- Добавляем новые поля в таблицу business_info
ALTER TABLE business_info
ADD COLUMN IF NOT EXISTS partner_search_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS investor_search_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS customer_search_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS employee_vacancies JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS banner_url VARCHAR(255);

-- Добавляем комментарии к полям
COMMENT ON COLUMN business_info.partner_search_details IS 'Детали пошуку партнера: тип партнера, сфера співпраці, умови, що пропонується';
COMMENT ON COLUMN business_info.investor_search_details IS 'Детали пошуку інвестора: необхідна сума, строк окупності, цілі інвестицій, що пропонується інвестору';
COMMENT ON COLUMN business_info.customer_search_details IS 'Детали пошуку споживачів: цільова аудиторія, опис пропозиції, переваги';
COMMENT ON COLUMN business_info.employee_vacancies IS 'Масив вакансій: посада, обов''язки, вимоги, зарплата, тип зайнятості, необхідний досвід';
COMMENT ON COLUMN business_info.banner_url IS 'URL банера компанії';

-- Создаем индекс для поиска по полям
CREATE INDEX IF NOT EXISTS idx_business_seeking_partner ON business_info(seeking_partner) WHERE seeking_partner = true;
CREATE INDEX IF NOT EXISTS idx_business_seeking_investor ON business_info(seeking_investor) WHERE seeking_investor = true;
CREATE INDEX IF NOT EXISTS idx_business_seeking_customer ON business_info(seeking_customer) WHERE seeking_customer = true;
CREATE INDEX IF NOT EXISTS idx_business_seeking_employee ON business_info(seeking_employee) WHERE seeking_employee = true;

-- Обновляем timestamp
UPDATE business_info SET updated_at = NOW() WHERE updated_at IS NOT NULL;
