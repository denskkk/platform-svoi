-- Скрипт для повного очищення користувачів та пов'язаних даних
-- УВАГА: Цей скрипт видалить ВСІ дані користувачів!
-- Використовуйте тільки для тестування!

BEGIN;

-- Вимкнути перевірку зовнішніх ключів
SET CONSTRAINTS ALL DEFERRED;

-- 1. Видалити повідомлення
DELETE FROM messages;
TRUNCATE TABLE messages RESTART IDENTITY CASCADE;

-- 2. Видалити відгуки
DELETE FROM reviews;
TRUNCATE TABLE reviews RESTART IDENTITY CASCADE;

-- 3. Видалити обране
DELETE FROM favorites;
TRUNCATE TABLE favorites RESTART IDENTITY CASCADE;

-- 4. Видалити скарги
DELETE FROM reports;
TRUNCATE TABLE reports RESTART IDENTITY CASCADE;

-- 5. Видалити сповіщення
DELETE FROM notifications;
TRUNCATE TABLE notifications RESTART IDENTITY CASCADE;

-- 6. Видалити відповіді на заявки
DELETE FROM request_responses;
TRUNCATE TABLE request_responses RESTART IDENTITY CASCADE;

-- 7. Видалити заявки
DELETE FROM requests;
TRUNCATE TABLE requests RESTART IDENTITY CASCADE;

-- 8. Видалити послуги
DELETE FROM services;
TRUNCATE TABLE services RESTART IDENTITY CASCADE;

-- 9. Видалити бізнес-інформацію
DELETE FROM business_info;
TRUNCATE TABLE business_info RESTART IDENTITY CASCADE;

-- 10. Видалити підписки
DELETE FROM subscriptions;
TRUNCATE TABLE subscriptions RESTART IDENTITY CASCADE;

-- 11. Видалити сесії
DELETE FROM sessions;
TRUNCATE TABLE sessions RESTART IDENTITY CASCADE;

-- 12. Видалити логи пошуку
DELETE FROM search_logs;
TRUNCATE TABLE search_logs RESTART IDENTITY CASCADE;

-- 13. Видалити всіх користувачів
DELETE FROM users;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Скинути послідовності
ALTER SEQUENCE users_user_id_seq RESTART WITH 1;
ALTER SEQUENCE services_service_id_seq RESTART WITH 1;
ALTER SEQUENCE requests_request_id_seq RESTART WITH 1;
ALTER SEQUENCE reviews_review_id_seq RESTART WITH 1;
ALTER SEQUENCE messages_message_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_notification_id_seq RESTART WITH 1;
ALTER SEQUENCE reports_report_id_seq RESTART WITH 1;
ALTER SEQUENCE subscriptions_subscription_id_seq RESTART WITH 1;
ALTER SEQUENCE sessions_session_id_seq RESTART WITH 1;
ALTER SEQUENCE search_logs_log_id_seq RESTART WITH 1;

COMMIT;

-- Вивести підсумок
SELECT 'База даних очищена! Всі користувачі та пов''язані дані видалено.' as status;
SELECT 'Категорії збережено.' as note;
SELECT COUNT(*) as remaining_users FROM users;
SELECT COUNT(*) as remaining_services FROM services;
SELECT COUNT(*) as remaining_categories FROM categories;
