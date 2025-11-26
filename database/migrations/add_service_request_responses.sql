-- Створення таблиці для відгуків виконавців на заявки
CREATE TABLE IF NOT EXISTS service_request_responses (
  response_id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES service_requests(service_request_id) ON DELETE CASCADE,
  executor_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Пропозиція виконавця
  proposed_price DECIMAL(10, 2) NOT NULL,
  comment TEXT NOT NULL,
  estimated_days INTEGER,
  
  -- Статус відгуку
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  is_selected BOOLEAN NOT NULL DEFAULT false,
  
  -- Таймштампи
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Один виконавець може залишити тільки один відгук на заявку
  UNIQUE(request_id, executor_id)
);

-- Індекси
CREATE INDEX idx_request_responses_request ON service_request_responses(request_id);
CREATE INDEX idx_request_responses_executor ON service_request_responses(executor_id);
CREATE INDEX idx_request_responses_status ON service_request_responses(status);

COMMENT ON TABLE service_request_responses IS 'Відгуки (пропозиції) виконавців на публічні заявки';
COMMENT ON COLUMN service_request_responses.proposed_price IS 'Запропонована ціна виконавця';
COMMENT ON COLUMN service_request_responses.comment IS 'Коментар виконавця до пропозиції';
COMMENT ON COLUMN service_request_responses.estimated_days IS 'Орієнтовний термін виконання в днях';
COMMENT ON COLUMN service_request_responses.is_selected IS 'Чи обрав клієнт цього виконавця';
