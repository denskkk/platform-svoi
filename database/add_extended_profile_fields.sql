-- Добавление расширенных полей профиля для анкеты
-- Выполнить: Get-Content database/add_extended_profile_fields.sql | docker exec -i sviy-postgres psql -U postgres -d sviydliasvoyikh

-- Основная информация
ALTER TABLE users ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);

-- Локация
ALTER TABLE users ADD COLUMN IF NOT EXISTS housing_type VARCHAR(50); -- будинок / квартира / інше
ALTER TABLE users ADD COLUMN IF NOT EXISTS living_situation VARCHAR(100); -- самостійно / з родиною

-- Персональная информация
ALTER TABLE users ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50); -- одружений / неодружений / у стосунках / розлучений
ALTER TABLE users ADD COLUMN IF NOT EXISTS family_composition TEXT; -- склад сім'ї (дружина, діти, батьки)
ALTER TABLE users ADD COLUMN IF NOT EXISTS children_count INTEGER; -- кількість дітей

-- Транспорт
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_car BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS car_info VARCHAR(200); -- марка, модель
ALTER TABLE users ADD COLUMN IF NOT EXISTS other_transport VARCHAR(200); -- велосипед, самокат, інше

-- Профессиональная деятельность
ALTER TABLE users ADD COLUMN IF NOT EXISTS profession VARCHAR(200); -- професія / спеціальність
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_status VARCHAR(100); -- працюю / не працюю / студент / пенсіонер
ALTER TABLE users ADD COLUMN IF NOT EXISTS workplace VARCHAR(255); -- місце роботи або вид діяльності
ALTER TABLE users ADD COLUMN IF NOT EXISTS education TEXT; -- освіта (спеціальність, навчальний заклад)
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_info TEXT; -- інфо про приватний бізнес
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_seeking TEXT; -- в якій сфері шукає роботу

-- Домашние животные
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_pets BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pets_info VARCHAR(255); -- які тварини (собака, кіт, інше)

-- Интересы и стиль жизни
ALTER TABLE users ADD COLUMN IF NOT EXISTS hobbies TEXT; -- хобі / захоплення
ALTER TABLE users ADD COLUMN IF NOT EXISTS outdoor_activities TEXT; -- охота, рибалка, спорт
ALTER TABLE users ADD COLUMN IF NOT EXISTS lifestyle TEXT; -- відвідування кафе, ресторанів, подорожі
ALTER TABLE users ADD COLUMN IF NOT EXISTS sports TEXT; -- спортивна активність

-- Соцсети
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Комментарии для документации
COMMENT ON COLUMN users.middle_name IS 'По батькові';
COMMENT ON COLUMN users.housing_type IS 'Тип житла: будинок / квартира / інше';
COMMENT ON COLUMN users.living_situation IS 'Проживання: самостійно / з родиною';
COMMENT ON COLUMN users.marital_status IS 'Сімейний стан: одружений / неодружений / у стосунках / розлучений';
COMMENT ON COLUMN users.family_composition IS 'Склад сім''ї: дружина, діти, батьки тощо';
COMMENT ON COLUMN users.children_count IS 'Кількість дітей';
COMMENT ON COLUMN users.has_car IS 'Наявність автомобіля';
COMMENT ON COLUMN users.car_info IS 'Інформація про авто: марка, модель';
COMMENT ON COLUMN users.other_transport IS 'Інший транспорт: велосипед, самокат';
COMMENT ON COLUMN users.profession IS 'Професія / спеціальність';
COMMENT ON COLUMN users.employment_status IS 'Статус зайнятості: працюю / тимчасово не працюю / студент / пенсіонер';
COMMENT ON COLUMN users.workplace IS 'Місце роботи або вид діяльності';
COMMENT ON COLUMN users.education IS 'Освіта: спеціальність, навчальний заклад';
COMMENT ON COLUMN users.business_info IS 'Інформація про приватний бізнес, посилання';
COMMENT ON COLUMN users.job_seeking IS 'Пошук роботи: в якій сфері';
COMMENT ON COLUMN users.has_pets IS 'Наявність домашніх тварин';
COMMENT ON COLUMN users.pets_info IS 'Інформація про тварин: собака, кіт, інше';
COMMENT ON COLUMN users.hobbies IS 'Хобі та захоплення: музика, мистецтво, подорожі';
COMMENT ON COLUMN users.outdoor_activities IS 'Активності на природі: охота, рибалка, спорт';
COMMENT ON COLUMN users.lifestyle IS 'Стиль життя: кафе, ресторани, подорожі';
COMMENT ON COLUMN users.sports IS 'Спортивна активність: вид спорту, рівень';
COMMENT ON COLUMN users.social_links IS 'Посилання на соцмережі: Instagram, Facebook, Telegram, TikTok';

-- Успешно добавлены расширенные поля профиля!
SELECT 'Розширені поля профілю успішно додано!' as result;
