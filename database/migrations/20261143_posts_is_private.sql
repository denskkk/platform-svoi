-- Закриті дописи (бачить лише автор). Колонка є в schema.prisma, але раніше не мала SQL-міграції. Безпечно повторювати.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
