-- Обновление таблицы business_info для расширенной бизнес-анкеты
-- Выполнить: Get-Content database/update_business_info_fields.sql | docker exec -i sviy-postgres psql -U postgres -d sviydliasvoyikh

-- Основная информация
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS representative_name VARCHAR(200);
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS business_type VARCHAR(200);

-- Короткий опис
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS mission TEXT;
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS unique_value TEXT;

-- Послуги та товари
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS services_list TEXT;
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS price_range VARCHAR(100);
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS service_location VARCHAR(255);

-- Команда
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS key_specialists TEXT;
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS team_description TEXT;

-- Контакти
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS viber VARCHAR(100);
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS telegram VARCHAR(100);
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS email VARCHAR(150);

-- Візуальні матеріали
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS video_url VARCHAR(255);

-- Відгуки
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS external_reviews JSONB DEFAULT '{}';

-- Додаткова інформація
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS registration_type VARCHAR(50);
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS has_certificates BOOLEAN;
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS certificates_info TEXT;
ALTER TABLE business_info ADD COLUMN IF NOT EXISTS partners TEXT;

-- Индексы для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_business_info_city ON business_info(city);
CREATE INDEX IF NOT EXISTS idx_business_info_business_type ON business_info(business_type);

-- Комментарии для документации
COMMENT ON COLUMN business_info.representative_name IS 'ПІБ представника бізнесу';
COMMENT ON COLUMN business_info.position IS 'Посада в компанії: власник / менеджер / адміністратор';
COMMENT ON COLUMN business_info.city IS 'Місто діяльності бізнесу';
COMMENT ON COLUMN business_info.region IS 'Регіон діяльності';
COMMENT ON COLUMN business_info.business_type IS 'Тип бізнесу / сфера послуг';
COMMENT ON COLUMN business_info.mission IS 'Основна місія / цінність бізнесу';
COMMENT ON COLUMN business_info.unique_value IS 'Чим бізнес відрізняється від інших';
COMMENT ON COLUMN business_info.services_list IS 'Список послуг або категорій';
COMMENT ON COLUMN business_info.price_range IS 'Ціновий діапазон: мінімальна / середня / преміум';
COMMENT ON COLUMN business_info.service_location IS 'Місце надання послуг: адреса або онлайн';
COMMENT ON COLUMN business_info.key_specialists IS 'Ключові спеціалісти / ролі в команді';
COMMENT ON COLUMN business_info.team_description IS 'Опис команди';
COMMENT ON COLUMN business_info.phone IS 'Телефон бізнесу';
COMMENT ON COLUMN business_info.viber IS 'Viber контакт';
COMMENT ON COLUMN business_info.telegram IS 'Telegram контакт';
COMMENT ON COLUMN business_info.email IS 'Email бізнесу';
COMMENT ON COLUMN business_info.video_url IS 'Відео-презентація бізнесу';
COMMENT ON COLUMN business_info.external_reviews IS 'Посилання на зовнішні відгуки: Google, Facebook';
COMMENT ON COLUMN business_info.registration_type IS 'Форма реєстрації: ФОП / ТОВ';
COMMENT ON COLUMN business_info.has_certificates IS 'Наявність сертифікатів / ліцензій';
COMMENT ON COLUMN business_info.certificates_info IS 'Опис сертифікатів та ліцензій';
COMMENT ON COLUMN business_info.partners IS 'Партнери або членство у спільнотах';

-- Успешно обновлена таблица business_info!
SELECT 'Таблиця business_info успішно оновлена!' as result;
