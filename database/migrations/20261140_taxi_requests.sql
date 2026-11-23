-- Таксі: замовлення та підписка на місто (additive)
CREATE TABLE IF NOT EXISTS taxi_requests (
  request_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  kind VARCHAR(12) NOT NULL,
  city VARCHAR(120) NOT NULL,
  from_address VARCHAR(255),
  to_address VARCHAR(255),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  driver_pref VARCHAR(16) NOT NULL DEFAULT 'any',
  status VARCHAR(16) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS taxi_requests_city_status_idx ON taxi_requests (city, status);
