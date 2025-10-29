-- ========================================
-- СВІЙ ДЛЯ СВОЇХ - PostgreSQL Schema
-- ========================================
-- Версія: 1.0.0
-- Автор: Database Team
-- Дата: 29 жовтня 2025
-- ========================================

-- Встановлюємо кодування UTF-8
SET client_encoding = 'UTF8';

-- Створюємо розширення для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- ENUM типи
-- ========================================

CREATE TYPE user_role AS ENUM ('user', 'business', 'viewer', 'admin');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE report_status AS ENUM ('new', 'in_review', 'resolved', 'rejected');

-- ========================================
-- 1. USERS - Користувачі
-- ========================================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'user',
    
    -- Основна інформація
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    
    -- Локація
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    
    -- Персональна інформація
    gender gender_type,
    age INT CHECK (age >= 16 AND age <= 120),
    bio TEXT,
    avatar_url VARCHAR(255),
    
    -- Рейтинг (кешований)
    avg_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (avg_rating >= 0 AND avg_rating <= 5),
    total_reviews INT DEFAULT 0,
    
    -- Метадані
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    -- Індекси
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Індекси для users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ========================================
-- 2. CATEGORIES - Категорії послуг
-- ========================================

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon_url VARCHAR(255),
    emoji VARCHAR(10),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Індекси для categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);

-- ========================================
-- 3. SERVICES - Послуги
-- ========================================

CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(category_id),
    
    -- Основна інформація
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    
    -- Ціна
    price_from DECIMAL(10,2) CHECK (price_from >= 0),
    price_to DECIMAL(10,2) CHECK (price_to >= price_from),
    price_unit VARCHAR(50), -- грн/год, грн/м², грн/шт
    
    -- Локація
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    address VARCHAR(255),
    
    -- Статус
    is_active BOOLEAN DEFAULT TRUE,
    views_count INT DEFAULT 0,
    
    -- Метадані
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Індекси для services
CREATE INDEX idx_services_user ON services(user_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_city ON services(city);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_created ON services(created_at DESC);
CREATE INDEX idx_services_price FROM services(price_from);

-- ========================================
-- 4. BUSINESS_INFO - Інформація про бізнес
-- ========================================

CREATE TABLE business_info (
    business_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Основна інформація
    company_name VARCHAR(200) NOT NULL,
    logo_url VARCHAR(255),
    description TEXT,
    
    -- Контакти та розташування
    address VARCHAR(255),
    work_hours VARCHAR(200), -- JSON або простий текст
    website VARCHAR(255),
    
    -- Соцмережі (JSON)
    social_links JSONB DEFAULT '{}',
    
    -- Галерея (масив URL)
    gallery JSONB DEFAULT '[]',
    
    -- Додаткова інформація
    year_founded INT,
    employee_count VARCHAR(50), -- "1-10", "11-50", "50+"
    
    -- Метадані
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Індекси для business_info
CREATE INDEX idx_business_user ON business_info(user_id);

-- ========================================
-- 5. REVIEWS - Відгуки
-- ========================================

CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    reviewer_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reviewed_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Оцінка та коментар
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Фото відгуку (опціонально)
    photos JSONB DEFAULT '[]',
    
    -- Метадані
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Обмеження: користувач не може залишити відгук сам собі
    CONSTRAINT no_self_review CHECK (reviewer_id != reviewed_id),
    
    -- Унікальність: один користувач = один відгук іншому
    CONSTRAINT unique_review UNIQUE (reviewer_id, reviewed_id)
);

-- Індекси для reviews
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewed ON reviews(reviewed_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

-- ========================================
-- 6. MESSAGES - Повідомлення
-- ========================================

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Контент
    text TEXT NOT NULL,
    attachment_url VARCHAR(255),
    attachment_type VARCHAR(50), -- image, file, document
    
    -- Статус
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted_by_sender BOOLEAN DEFAULT FALSE,
    is_deleted_by_receiver BOOLEAN DEFAULT FALSE,
    
    -- Метадані
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Обмеження: не можна написати самому собі
    CONSTRAINT no_self_message CHECK (sender_id != receiver_id)
);

-- Індекси для messages
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;

-- Композитний індекс для чатів
CREATE INDEX idx_messages_chat ON messages(sender_id, receiver_id, created_at DESC);

-- ========================================
-- 7. FAVORITES - Обране
-- ========================================

CREATE TABLE favorites (
    favorite_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Обмеження: користувач не може додати себе в обране
    CONSTRAINT no_self_favorite CHECK (user_id != target_user_id),
    
    -- Унікальність
    CONSTRAINT unique_favorite UNIQUE (user_id, target_user_id)
);

-- Індекси для favorites
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_target ON favorites(target_user_id);

-- ========================================
-- 8. REPORTS - Скарги
-- ========================================

CREATE TABLE reports (
    report_id SERIAL PRIMARY KEY,
    reporter_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reported_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Деталі скарги
    reason TEXT NOT NULL,
    category VARCHAR(100), -- spam, inappropriate, fake, other
    
    -- Статус та обробка
    status report_status DEFAULT 'new',
    admin_comment TEXT,
    admin_id INT REFERENCES users(user_id),
    
    -- Метадані
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    
    -- Обмеження: користувач не може скаржитися на себе
    CONSTRAINT no_self_report CHECK (reporter_id != reported_user_id)
);

-- Індекси для reports
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- ========================================
-- 9. NOTIFICATIONS - Сповіщення
-- ========================================

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Контент
    type VARCHAR(50) NOT NULL, -- new_message, new_review, profile_view, etc.
    title VARCHAR(200) NOT NULL,
    message TEXT,
    
    -- Пов'язані дані
    related_user_id INT REFERENCES users(user_id),
    related_entity_type VARCHAR(50), -- message, review, service
    related_entity_id INT,
    
    -- Статус
    is_read BOOLEAN DEFAULT FALSE,
    
    -- Метадані
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Індекси для notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ========================================
-- 10. SESSIONS - Сесії користувачів
-- ========================================

CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Токен та метадані
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_hash VARCHAR(255),
    
    -- Інформація про пристрій
    user_agent TEXT,
    ip_address VARCHAR(45),
    
    -- Час життя
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Статус
    is_active BOOLEAN DEFAULT TRUE
);

-- Індекси для sessions
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_active ON sessions(is_active) WHERE is_active = TRUE;

-- ========================================
-- 11. SEARCH_LOGS - Історія пошуку
-- ========================================

CREATE TABLE search_logs (
    search_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Параметри пошуку
    query TEXT,
    category_id INT REFERENCES categories(category_id),
    city VARCHAR(100),
    
    -- Результати
    results_count INT DEFAULT 0,
    
    -- Метадані
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

-- Індекси для search_logs
CREATE INDEX idx_search_user ON search_logs(user_id);
CREATE INDEX idx_search_created ON search_logs(created_at DESC);
CREATE INDEX idx_search_query ON search_logs(query);

-- ========================================
-- 12. CITIES - Довідник міст (опціонально)
-- ========================================

CREATE TABLE cities (
    city_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    name_en VARCHAR(100),
    region VARCHAR(100),
    
    -- Координати (для геопошуку)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Статистика
    users_count INT DEFAULT 0,
    services_count INT DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE
);

-- Індекси для cities
CREATE INDEX idx_cities_name ON cities(name);
CREATE INDEX idx_cities_region ON cities(region);

-- ========================================
-- ТРИГЕРИ
-- ========================================

-- Автоматичне оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Застосовуємо тригер до всіх потрібних таблиць
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_info_updated_at BEFORE UPDATE ON business_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Автоматичне оновлення середнього рейтингу
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET 
        avg_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE reviewed_id = NEW.reviewed_id AND is_visible = TRUE
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM reviews
            WHERE reviewed_id = NEW.reviewed_id AND is_visible = TRUE
        )
    WHERE user_id = NEW.reviewed_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rating_after_review AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- ========================================
-- КОМЕНТАРІ ДО ТАБЛИЦЬ
-- ========================================

COMMENT ON TABLE users IS 'Основна таблиця користувачів платформи';
COMMENT ON TABLE categories IS 'Категорії послуг (Побут, Авто, Краса, тощо)';
COMMENT ON TABLE services IS 'Послуги, які пропонують користувачі';
COMMENT ON TABLE business_info IS 'Розширена інформація для бізнес-акаунтів';
COMMENT ON TABLE reviews IS 'Відгуки користувачів один про одного';
COMMENT ON TABLE messages IS 'Приватні повідомлення між користувачами';
COMMENT ON TABLE favorites IS 'Обрані профілі користувачів';
COMMENT ON TABLE reports IS 'Скарги на користувачів та модерація';
COMMENT ON TABLE notifications IS 'Системні сповіщення для користувачів';
COMMENT ON TABLE sessions IS 'Активні сесії користувачів (JWT токени)';
COMMENT ON TABLE search_logs IS 'Історія пошукових запитів';
COMMENT ON TABLE cities IS 'Довідник міст України';

-- ========================================
-- ЗАВЕРШЕННЯ
-- ========================================

-- Виводимо статистику створених об'єктів
SELECT 
    'База даних створена успішно! 🎉' AS status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS tables_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public') AS columns_count;
