-- Заявки бізнесу (additive). Безпечно запускати повторно.
CREATE TABLE IF NOT EXISTS business_applications (
  application_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  company_name VARCHAR(150) NOT NULL,
  activity VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL,
  contact_name VARCHAR(100),
  phone VARCHAR(30) NOT NULL,
  website VARCHAR(255),
  description TEXT NOT NULL,
  project_slug VARCHAR(60),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  proposed_reward_percent DECIMAL(5,2),
  reject_reason VARCHAR(500),
  moderated_at TIMESTAMP,
  moderated_by_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS business_applications_user_id_idx ON business_applications(user_id);
CREATE INDEX IF NOT EXISTS business_applications_status_created_at_idx ON business_applications(status, created_at);
