-- Додати поле ucm_verified до таблиці users
ALTER TABLE users ADD COLUMN IF NOT EXISTS ucm_verified BOOLEAN DEFAULT false;

-- Додати індекс для швидкого пошуку верифікованих користувачів
CREATE INDEX IF NOT EXISTS idx_users_ucm_verified ON users(ucm_verified) WHERE ucm_verified = true;

-- Коментар
COMMENT ON COLUMN users.ucm_verified IS 'Перевірено УЦМ - значок для надійних користувачів';
