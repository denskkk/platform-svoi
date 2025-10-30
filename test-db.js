// Тестовий скрипт для перевірки підключення до БД
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Тестування підключення до бази даних...');
    
    // Тест 1: Підключення
    await prisma.$connect();
    console.log('✅ Підключення успішне!');
    
    // Тест 2: Перевірка таблиць
    const userCount = await prisma.user.count();
    console.log(`✅ Таблиця User існує. Користувачів: ${userCount}`);
    
    const categoryCount = await prisma.category.count();
    console.log(`✅ Таблиця Category існує. Категорій: ${categoryCount}`);
    
    // Тест 3: Спроба створити тестового користувача (видалимо після)
    console.log('\n📝 Тестування створення користувача...');
    
    const testEmail = `test-${Date.now()}@test.com`;
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'test_hash_12345678',
        role: 'user',
      }
    });
    
    console.log(`✅ Користувач створений! ID: ${testUser.id}`);
    
    // Видалити тестового користувача
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ Тестовий користувач видалений');
    
    console.log('\n🎉 Всі тести пройшли успішно! База даних працює коректно.');
    
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    console.error('\nДеталі помилки:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
