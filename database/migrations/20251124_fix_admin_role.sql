-- Виправлення помилки з enum AccountType
-- Спочатку видалимо тимчасовий тип якщо він існує

DROP TYPE IF EXISTS "AccountType_new" CASCADE;

-- Тепер додамо поле isAdmin безпечно
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Створити індекс для швидкого пошуку адміністраторів
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Додати коментар
COMMENT ON COLUMN users.is_admin IS 'Чи є користувач адміністратором платформи';

-- Зробити першого користувача адміністратором
UPDATE users SET is_admin = TRUE WHERE user_id = 1;

-- Показати результат
SELECT user_id, first_name, last_name, email, is_admin 
FROM users 
WHERE is_admin = TRUE;
