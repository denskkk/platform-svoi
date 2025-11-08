/**
 * Скрипт для очищення всіх користувачів з бази даних
 * УВАГА: Видалить ВСІ користувацькі дані!
 * Використовуйте тільки для тестування!
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function clearAllUsers() {
  console.log('\n⚠️  УВАГА! ⚠️');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Цей скрипт видалить ВСІ дані користувачів з бази даних:');
  console.log('- Всі користувачі (users)');
  console.log('- Всі послуги (services)');
  console.log('- Всі заявки (requests)');
  console.log('- Всі повідомлення (messages)');
  console.log('- Всі відгуки (reviews)');
  console.log('- Всі підписки (subscriptions)');
  console.log('- Бізнес-інформація (business_info)');
  console.log('- Та всі пов\'язані дані');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ Категорії послуг будуть ЗБЕРЕЖЕНІ\n');

  rl.question('Ви впевнені? Напишіть "YES" для підтвердження: ', async (answer) => {
    if (answer !== 'YES') {
      console.log('❌ Операція скасована');
      rl.close();
      await prisma.$disconnect();
      process.exit(0);
    }

    try {
      console.log('\n🗑️  Починаємо очищення...\n');

      // Вимкнути перевірку зовнішніх ключів
      await prisma.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;

      // 1. Видалити повідомлення
      console.log('1/13 Видалення повідомлень...');
      await prisma.message.deleteMany();

      // 2. Видалити відгуки
      console.log('2/13 Видалення відгуків...');
      await prisma.review.deleteMany();

      // 3. Видалити обране
      console.log('3/13 Видалення обраного...');
      await prisma.favorite.deleteMany();

      // 4. Видалити скарги
      console.log('4/13 Видалення скарг...');
      await prisma.report.deleteMany();

      // 5. Видалити сповіщення
      console.log('5/13 Видалення сповіщень...');
      await prisma.notification.deleteMany();

      // 6. Видалити відповіді на заявки
      console.log('6/13 Видалення відповідей на заявки...');
      await prisma.requestResponse.deleteMany();

      // 7. Видалити заявки
      console.log('7/13 Видалення заявок...');
      await prisma.request.deleteMany();

      // 8. Видалити послуги
      console.log('8/13 Видалення послуг...');
      await prisma.service.deleteMany();

      // 9. Видалити бізнес-інформацію
      console.log('9/13 Видалення бізнес-інформації...');
      await prisma.businessInfo.deleteMany();

      // 10. Видалити підписки
      console.log('10/13 Видалення підписок...');
      await prisma.subscription.deleteMany();

      // 11. Видалити сесії
      console.log('11/13 Видалення сесій...');
      await prisma.session.deleteMany();

      // 12. Видалити логи пошуку
      console.log('12/13 Видалення логів пошуку...');
      await prisma.searchLog.deleteMany();

      // 13. Видалити всіх користувачів
      console.log('13/13 Видалення користувачів...');
      await prisma.user.deleteMany();

      // Скинути послідовності (auto-increment)
      console.log('\n🔄 Скидання лічильників ID...');
      await prisma.$executeRaw`ALTER SEQUENCE users_user_id_seq RESTART WITH 1`;
      await prisma.$executeRaw`ALTER SEQUENCE services_service_id_seq RESTART WITH 1`;
      await prisma.$executeRaw`ALTER SEQUENCE requests_request_id_seq RESTART WITH 1`;
      await prisma.$executeRaw`ALTER SEQUENCE reviews_review_id_seq RESTART WITH 1`;
      await prisma.$executeRaw`ALTER SEQUENCE messages_message_id_seq RESTART WITH 1`;

      // Підрахунок
      const usersCount = await prisma.user.count();
      const servicesCount = await prisma.service.count();
      const categoriesCount = await prisma.category.count();

      console.log('\n✅ База даних успішно очищена!');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`👥 Користувачів: ${usersCount}`);
      console.log(`📦 Послуг: ${servicesCount}`);
      console.log(`📂 Категорій: ${categoriesCount} (збережено)`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('\n🎉 Готово! Тепер можна реєструвати нових користувачів\n');

    } catch (error) {
      console.error('\n❌ Помилка при очищенні:', error);
      process.exit(1);
    } finally {
      rl.close();
      await prisma.$disconnect();
    }
  });
}

clearAllUsers();
