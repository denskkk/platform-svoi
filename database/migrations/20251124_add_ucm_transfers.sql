-- Додаємо нові типи транзакцій для переказів між користувачами
-- Дата: 24 листопада 2025

DO $$ 
BEGIN
    -- Перевіряємо чи існує таблиця ucm_transactions
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema='public' AND table_name='ucm_transactions'
    ) THEN
        -- Додаємо коментар до таблиці про нові типи транзакцій
        COMMENT ON TABLE ucm_transactions IS 'Історія UCM транзакцій. Підтримує типи: referral_bonus, profile_complete, service_create, request_create, upgrade, transfer_sent, transfer_received';
        
        -- Створюємо індекс для швидкого пошуку переказів
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename='ucm_transactions' AND indexname='idx_ucm_tx_transfers'
        ) THEN
            CREATE INDEX idx_ucm_tx_transfers ON ucm_transactions(user_id, reason) 
            WHERE reason IN ('transfer_sent', 'transfer_received');
        END IF;
        
        RAISE NOTICE 'UCM transfers migration completed successfully';
    ELSE
        RAISE NOTICE 'Table ucm_transactions does not exist, skipping migration';
    END IF;
END $$;
