-- Таксі: тип поїздки, клас авто, дата й час, побажання, кількість пасажирів (additive)
ALTER TABLE taxi_requests ADD COLUMN IF NOT EXISTS ride_type VARCHAR(16);
ALTER TABLE taxi_requests ADD COLUMN IF NOT EXISTS car_class VARCHAR(16);
ALTER TABLE taxi_requests ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP(3);
ALTER TABLE taxi_requests ADD COLUMN IF NOT EXISTS wishes VARCHAR(255);
ALTER TABLE taxi_requests ADD COLUMN IF NOT EXISTS passengers INTEGER;
CREATE INDEX IF NOT EXISTS taxi_requests_user_idx ON taxi_requests (user_id, request_id);
