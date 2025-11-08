-- Міграція: Оновлення категорій послуг
-- Дата: 2025-11-08

-- Оновлюємо існуючі категорії та додаємо нові

-- 1. Все для дому
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Все для дому', 'vse-dlya-domu', '🏠', 'Ремонт, прибирання, майстри', 1, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 2. Все для Авто
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Все для Авто', 'vse-dlya-auto', '🚗', 'Авто, мото, велосипеди, самокати', 2, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 3. Краса
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Краса', 'krasa', '💅', 'Салони, перукарі, косметологи', 3, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 4. Освіта
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Освіта', 'osvita', '📚', 'Курси, репетитори, навчання', 4, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 5. Розваги та хоббі
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Розваги та хоббі', 'rozvagy-ta-hobbi', '🎨', 'Спорт, дозвілля, творчість', 5, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 6. Все для дітей
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Все для дітей', 'vse-dlya-ditey', '👶', 'Садочки, секції, іграшки', 6, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 7. Магазини онлайн
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Магазини онлайн', 'magazyny-online', '🛒', 'Інтернет-магазини', 7, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 8. Магазини офлайн
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Магазини офлайн', 'magazyny-offline', '🏪', 'Фізичні магазини', 8, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 9. Все для домашніх тварин
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Все для домашніх тварин', 'vse-dlya-tvaryn', '🐾', 'Ветеринари, зоомагазини', 9, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 10. Ресторани, готелі
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Ресторани, готелі', 'restorany-goteli', '🍽️', 'HoReCa, кейтеринг', 10, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 11. Агенство з продажу Нерухомості
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Агенство з продажу Нерухомості', 'neruhomist', '🏢', 'Продаж, оренда житла', 11, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 12. Агенство з продажу Рухомого майна
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Агенство з продажу Рухомого майна', 'ruhome-mayno', '🚛', 'Авто, техніка, обладнання', 12, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 13. Заявки на виконання задач онлайн та офлайн
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Заявки на виконання задач онлайн та офлайн', 'zayavky-na-zadachi', '✅', 'Онлайн та офлайн послуги', 13, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 14. Дошка подій та оголошень
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Дошка подій та оголошень', 'podiyi-ta-ogoloshennya', '📢', 'Події, новини, оголошення', 14, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 15. Все для обслуговування та розвитку вашого бізнесу
INSERT INTO categories (name, slug, emoji, description, sort_order, is_active)
VALUES ('Все для обслуговування та розвитку вашого бізнесу', 'vse-dlya-biznesu', '💼', 'B2B послуги для бізнесу', 15, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;
