-- Переговори між учасниками проєкту (адитивна міграція; грошей не рухає)
CREATE TABLE IF NOT EXISTS negotiations (
  negotiation_id SERIAL PRIMARY KEY,
  project_slug   VARCHAR(60)  NOT NULL,
  creator_id     INTEGER      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  partner_id     INTEGER      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title          VARCHAR(150) NOT NULL,
  product        VARCHAR(150),
  volume         VARCHAR(100),
  price          VARCHAR(100),
  pay_terms      VARCHAR(200),
  delivery       VARCHAR(200),
  status         VARCHAR(16)  NOT NULL DEFAULT 'open',
  creator_agreed BOOLEAN      NOT NULL DEFAULT FALSE,
  partner_agreed BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS negotiations_creator_idx ON negotiations (creator_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS negotiations_partner_idx ON negotiations (partner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS negotiation_messages (
  message_id     SERIAL PRIMARY KEY,
  negotiation_id INTEGER      NOT NULL REFERENCES negotiations(negotiation_id) ON DELETE CASCADE,
  author_id      INTEGER      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  kind           VARCHAR(10)  NOT NULL DEFAULT 'text',
  text           VARCHAR(2000) NOT NULL,
  attachment_url VARCHAR(255),
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS negotiation_messages_neg_idx ON negotiation_messages (negotiation_id, message_id);
