-- Скрипт для очищення всіх даних (акаунти, послуги, відгуки)
-- УВАГА: Це видалить ВСІ дані з таблиць!

BEGIN;

-- Видалити всі відгуки
DELETE FROM reviews;
RAISE NOTICE 'Видалено всі відгуки';

-- Видалити всі послуги
DELETE FROM services;
RAISE NOTICE 'Видалено всі послуги';

-- Видалити всю бізнес-інформацію
DELETE FROM business_info;
RAISE NOTICE 'Видалено всю бізнес-інформацію';

-- Видалити всіх користувачів
DELETE FROM users;
RAISE NOTICE 'Видалено всіх користувачів';

-- Скинути послідовності ID (щоб нові записи починалися з 1)
ALTER SEQUENCE users_user_id_seq RESTART WITH 1;
ALTER SEQUENCE services_service_id_seq RESTART WITH 1;
ALTER SEQUENCE reviews_review_id_seq RESTART WITH 1;
ALTER SEQUENCE business_info_business_id_seq RESTART WITH 1;

RAISE NOTICE '✅ Всі дані успішно видалено! База готова до нового старту.';

COMMIT;
