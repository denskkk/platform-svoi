-- Додати поля для фото послуг
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE services ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Додати коментарі
COMMENT ON COLUMN services.image_url IS 'URL основного зображення послуги';
COMMENT ON COLUMN services.images IS 'Масив URL додаткових зображень послуги';

-- Створити індекс для швидкого пошуку послуг з фото
CREATE INDEX IF NOT EXISTS idx_services_has_image ON services ((image_url IS NOT NULL));

SELECT 'Таблиця services успішно оновлена для підтримки фото!' as result;
