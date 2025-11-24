const { PrismaClient } = require('@prisma/client');

async function migrate() {
  const prisma = new PrismaClient();
  
  try {
    console.log('✅ Підключено до бази даних');
    
    // Виконати SQL напряму через Prisma
    await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "AccountType_new" CASCADE');
    console.log('✅ Очищено старі типи');
    
    await prisma.$executeRawUnsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE');
    console.log('✅ Додано поле is_admin');
    
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE');
    console.log('✅ Створено індекс');
    
    await prisma.$executeRawUnsafe('UPDATE users SET is_admin = TRUE WHERE user_id = 1');
    console.log('✅ Встановлено адмін права для user_id = 1');
    
    // Показати адміністраторів
    const admins = await prisma.$queryRawUnsafe('SELECT user_id, first_name, last_name, email, is_admin FROM users WHERE is_admin = TRUE');
    console.log('\n📋 Список адміністраторів:');
    console.table(admins);
    
    console.log('\n🎉 Міграція успішно завершена!');
    console.log('Тепер можна перезапустити сервер: pm2 restart sviy-web');
    
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
