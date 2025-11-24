-- Міграція: Додавання поля isAdmin для адміністраторів
-- Дата: 2025-11-24
-- Опис: Додає можливість призначати адміністраторів платформи

-- Додати поле isAdmin в таблицю users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Створити індекс для швидкого пошуку адміністраторів
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Додати коментар
COMMENT ON COLUMN users.is_admin IS 'Чи є користувач адміністратором платформи';

-- Опціонально: зробити першого користувача адміністратором (розкоментуйте якщо потрібно)
-- UPDATE users SET is_admin = TRUE WHERE user_id = 1;
