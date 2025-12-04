const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createPaymentsTable() {
  console.log('🔧 Створення таблиці payments...\n');
  
  try {
    // Перевіряємо чи таблиця вже існує
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payments'
      );
    `;
    
    if (tableExists[0].exists) {
      console.log('✅ Таблиця payments вже існує\n');
      return;
    }
    
    console.log('📝 Створюємо таблицю payments...');
    
    // Створюємо таблицю
    await prisma.$executeRawUnsafe(`
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
    `);
    
    console.log('✅ Таблиця створена');
    
    // Створюємо індекси
    console.log('📝 Створюємо індекси...');
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
    `);
    
    console.log('✅ Індекси створені');
    
    // Створюємо тригер для updated_at
    console.log('📝 Створюємо тригер для updated_at...');
    
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_payments_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER trigger_payments_updated_at
          BEFORE UPDATE ON public.payments
          FOR EACH ROW
          EXECUTE FUNCTION update_payments_updated_at();
    `);
    
    console.log('✅ Тригер створено\n');
    
    console.log('🎉 Таблиця payments успішно створена!\n');
    
    // Перевірка
    const count = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM public.payments;
    `;
    
    console.log(`📊 Кількість записів: ${count[0].count}`);
    
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createPaymentsTable();
