-- Міграція для надання початкового балансу UCM всім існуючим користувачам
-- Звичайні користувачі: 5 UCM
-- Бізнес акаунти: 50 UCM

DO $$ 
DECLARE
    v_user RECORD;
    v_bonus INTEGER;
    v_has_transactions BOOLEAN;
    v_has_kind_column BOOLEAN;
BEGIN
    -- Перевірка чи існує таблиця ucm_transactions
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema='public' AND table_name='ucm_transactions'
    ) INTO v_has_transactions;

    -- Перевірка чи існує колонка kind
    IF v_has_transactions THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema='public' 
            AND table_name='ucm_transactions' 
            AND column_name='kind'
        ) INTO v_has_kind_column;
    ELSE
        v_has_kind_column := FALSE;
    END IF;

    -- Оновити баланс для користувачів, які не мають UCM транзакцій
    FOR v_user IN 
        SELECT u.user_id as id, u.role, u.account_type, u.balance_ucm
        FROM users u
        WHERE u.balance_ucm = 0
        AND NOT EXISTS (
            SELECT 1 FROM ucm_transactions 
            WHERE user_id = u.user_id 
            AND reason = 'signup_bonus'
        )
    LOOP
        -- Визначити бонус залежно від типу акаунту
        IF v_user.account_type = 'business' THEN
            v_bonus := 50;
        ELSE
            v_bonus := 5;
        END IF;

        -- Оновити баланс користувача
        UPDATE users 
        SET balance_ucm = balance_ucm + v_bonus 
        WHERE user_id = v_user.id;

        -- Створити транзакцію якщо таблиця існує
        IF v_has_transactions THEN
            IF v_has_kind_column THEN
                -- Нова структура з колонкою kind
                INSERT INTO ucm_transactions (
                    user_id, 
                    kind, 
                    amount, 
                    reason, 
                    related_entity_type, 
                    related_entity_id,
                    meta,
                    created_at
                ) VALUES (
                    v_user.id,
                    'credit',
                    v_bonus,
                    'signup_bonus',
                    NULL,
                    NULL,
                    '{"description": "Початковий бонус для існуючих користувачів"}'::jsonb,
                    NOW()
                );
            ELSE
                -- Стара структура без колонки kind
                INSERT INTO ucm_transactions (
                    user_id, 
                    amount, 
                    reason, 
                    created_at
                ) VALUES (
                    v_user.id,
                    v_bonus,
                    'signup_bonus',
                    NOW()
                );
            END IF;
        END IF;

        RAISE NOTICE 'Додано % UCM користувачу ID %', v_bonus, v_user.id;
    END LOOP;

    RAISE NOTICE 'Міграцію завершено успішно';
END $$;
