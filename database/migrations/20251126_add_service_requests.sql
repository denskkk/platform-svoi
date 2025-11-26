-- ========================================
-- Міграція: Додати систему заявок на послуги
-- Дата: 2025-11-26
-- Опис: Додає таблицю service_requests для заявок клієнтів виконавцям
-- ========================================

-- Створити ENUM для статусів заявок
DO $$ BEGIN
  CREATE TYPE service_request_status AS ENUM (
    'new',
    'viewed',
    'accepted',
    'in_progress',
    'completed',
    'paid',
    'cancelled',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Створити таблицю заявок на послуги
CREATE TABLE IF NOT EXISTS service_requests (
  service_request_id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  executor_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  service_id INTEGER REFERENCES services(service_id) ON DELETE SET NULL,
  
  -- Деталі заявки
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  
  -- Локація
  city VARCHAR(100),
  address VARCHAR(255),
  
  -- Медіа
  photos JSONB DEFAULT '[]'::jsonb,
  
  -- Бюджет і оплата
  budget_from DECIMAL(10, 2),
  budget_to DECIMAL(10, 2),
  agreed_price DECIMAL(10, 2),
  price_ucm DECIMAL(12, 2),
  is_paid BOOLEAN DEFAULT FALSE,
  
  -- Статус
  status service_request_status DEFAULT 'new',
  
  -- Терміни
  desired_date TIMESTAMP,
  deadline TIMESTAMP,
  
  -- Метадані
  priority VARCHAR(20) DEFAULT 'normal',
  views_count INTEGER DEFAULT 0,
  
  -- Таймштампи
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  paid_at TIMESTAMP
);

-- Індекси для продуктивності
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_executor ON service_requests(executor_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_service ON service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_city ON service_requests(city);
CREATE INDEX IF NOT EXISTS idx_service_requests_category ON service_requests(category);
CREATE INDEX IF NOT EXISTS idx_service_requests_created ON service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_status_created ON service_requests(status, created_at DESC);

-- Розширити таблицю відгуків для прив'язки до заявок
ALTER TABLE reviews 
  DROP CONSTRAINT IF EXISTS reviews_reviewer_id_reviewed_id_key,
  ADD COLUMN IF NOT EXISTS service_request_id INTEGER REFERENCES service_requests(service_request_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_service_request ON reviews(service_request_id);

-- Оновити тригер для updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_service_requests_updated_at ON service_requests;
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
