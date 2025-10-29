/**
 * Скрипт для очищення всієї бази даних
 * Видаляє всі записи з усіх таблиць
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🗑️  Початок очищення бази даних...\n');

    // Видаляємо в правильному порядку (щоб не порушити foreign keys)
    
    console.log('📝 Видалення відгуків...');
    const reviews = await prisma.review.deleteMany({});
    console.log(`✓ Видалено ${reviews.count} відгуків`);

    console.log('📝 Видалення сесій...');
    const sessions = await prisma.session.deleteMany({});
    console.log(`✓ Видалено ${sessions.count} сесій`);

    console.log('📝 Видалення послуг...');
    const services = await prisma.service.deleteMany({});
    console.log(`✓ Видалено ${services.count} послуг`);

    console.log('📝 Видалення бізнес-інформації...');
    const businessInfo = await prisma.businessInfo.deleteMany({});
    console.log(`✓ Видалено ${businessInfo.count} бізнес-профілів`);

    console.log('📝 Видалення користувачів...');
    const users = await prisma.user.deleteMany({});
    console.log(`✓ Видалено ${users.count} користувачів`);

    console.log('\n✅ База даних успішно очищена!');
    console.log('\n📊 Підсумок:');
    console.log(`   - Користувачі: ${users.count}`);
    console.log(`   - Послуги: ${services.count}`);
    console.log(`   - Бізнес-профілі: ${businessInfo.count}`);
    console.log(`   - Відгуки: ${reviews.count}`);
    console.log(`   - Сесії: ${sessions.count}`);
    console.log(`   - ВСЬОГО: ${users.count + services.count + businessInfo.count + reviews.count + sessions.count} записів\n`);

  } catch (error) {
    console.error('❌ Помилка при очищенні бази даних:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase()
  .then(() => {
    console.log('👋 Готово! Можна починати заново.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Критична помилка:', error);
    process.exit(1);
  });
