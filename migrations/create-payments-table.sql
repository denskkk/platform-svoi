-- Створення таблиці payments
CREATE TABLE IF NOT EXISTS public.payments (
    payment_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    provider VARCHAR(50) DEFAULT 'wayforpay' NOT NULL,
    order_reference VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'UAH' NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'new' NOT NULL,
    invoice_url VARCHAR(255),
    raw_request JSONB,
    raw_response JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_payment_user FOREIGN KEY (user_id) 
        REFERENCES public.users(user_id) ON DELETE CASCADE
);

-- Індекси
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Тригер для updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Вивід результату
SELECT 'Таблиця payments успішно створена!' as result;
