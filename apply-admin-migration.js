const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Підключено до бази даних');
    
    // Видалити старий тип якщо є
    await client.query('DROP TYPE IF EXISTS "AccountType_new" CASCADE');
    console.log('✅ Очищено старі типи');
    
    // Додати поле isAdmin
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE');
    console.log('✅ Додано поле is_admin');
    
    // Створити індекс
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE');
    console.log('✅ Створено індекс');
    
    // Зробити першого користувача адміном
    const updateResult = await client.query('UPDATE users SET is_admin = TRUE WHERE user_id = 1 RETURNING user_id, first_name, last_name, email');
    console.log('✅ Встановлено адмін права для:', updateResult.rows);
    
    // Показати всіх адміністраторів
    const result = await client.query('SELECT user_id, first_name, last_name, email, is_admin FROM users WHERE is_admin = TRUE');
    console.log('\n📋 Список адміністраторів:');
    console.table(result.rows);
    
    console.log('\n🎉 Міграція успішно завершена!');
    console.log('Тепер можна перезапустити сервер: pm2 restart sviy-web');
    
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    console.error('Деталі:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
