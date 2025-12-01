-- Виправлення enum AccountType
-- Додаємо значення 'viewer' якщо його немає

-- Перевірка та додавання значення viewer до enum
DO $$
BEGIN
    -- Перевіряємо чи існує значення 'viewer'
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'viewer' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'AccountType'
        )
    ) THEN
        -- Додаємо значення 'viewer' до enum
        ALTER TYPE "AccountType" ADD VALUE 'viewer';
    END IF;
END
$$;
