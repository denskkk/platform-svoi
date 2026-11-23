-- Заявки громадських організацій (additive). Безпечно запускати повторно.
CREATE TABLE IF NOT EXISTS organization_applications (
  organization_application_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  direction VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  country VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(150),
  website VARCHAR(255),
  social_links VARCHAR(500),
  goals VARCHAR(2000),
  participation VARCHAR(1000),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reject_reason VARCHAR(500),
  moderated_at TIMESTAMP(3),
  moderated_by_id INTEGER,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS organization_applications_user_id_idx ON organization_applications(user_id);
CREATE INDEX IF NOT EXISTS organization_applications_status_created_idx ON organization_applications(status, created_at);
