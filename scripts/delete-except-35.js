/**
 * Удаление всех пользователей кроме ID 35
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllExcept35() {
  try {
    console.log('\n🗑️  УДАЛЕНИЕ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ КРОМЕ ID 35\n');
    console.log('='.repeat(70));

    // Получаем всех пользователей кроме 35
    const users = await prisma.user.findMany({
      where: {
        id: { not: 35 }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });

    if (users.length === 0) {
      console.log('\n✅ Нет пользователей для удаления (кроме ID 35)\n');
      return;
    }

    console.log(`\nНайдено пользователей для удаления: ${users.length}\n`);
    users.forEach(u => {
      console.log(`  [${u.id}] ${u.firstName} ${u.lastName} (${u.email})`);
    });

    console.log('\n🗑️  Начинаем удаление...\n');

    for (const user of users) {
      console.log(`\n📍 Удаляем: [${user.id}] ${user.firstName} ${user.lastName}`);

      // 1. Отзывы
      await prisma.review.deleteMany({
        where: { OR: [{ reviewerId: user.id }, { reviewedId: user.id }] }
      });
      console.log('   ✓ Отзывы');

      // 2. Сообщения
      await prisma.message.deleteMany({
        where: { OR: [{ senderId: user.id }, { receiverId: user.id }] }
      });
      console.log('   ✓ Сообщения');

      // 3. Разговоры
      await prisma.conversation.deleteMany({
        where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] }
      });
      console.log('   ✓ Разговоры');

      // 4. UCM транзакции
      await prisma.ucmTransaction.deleteMany({
        where: { userId: user.id }
      });
      console.log('   ✓ UCM транзакции');

      // 5. Ответы на заявки (как исполнитель)
      await prisma.serviceRequestResponse.deleteMany({
        where: { executorId: user.id }
      });
      console.log('   ✓ Ответы на заявки');

      // 6. Удаляем ответы на его заявки
      const userRequests = await prisma.serviceRequest.findMany({
        where: { clientId: user.id },
        select: { id: true }
      });

      for (const req of userRequests) {
        await prisma.serviceRequestResponse.deleteMany({
          where: { requestId: req.id }
        });
      }
      console.log('   ✓ Ответы на его заявки');

      // 7. Его заявки
      await prisma.serviceRequest.deleteMany({
        where: { clientId: user.id }
      });
      console.log('   ✓ Заявки');

      // 8. Услуги
      await prisma.service.deleteMany({
        where: { userId: user.id }
      });
      console.log('   ✓ Услуги');

      // 9. Бизнес информация
      await prisma.businessInfo.deleteMany({
        where: { userId: user.id }
      });
      console.log('   ✓ Бизнес информация');

      // 10. Сессии
      await prisma.session.deleteMany({
        where: { userId: user.id }
      });
      console.log('   ✓ Сессии');

      // 11. Удаляем пользователя
      await prisma.user.delete({
        where: { id: user.id }
      });
      console.log('   ✅ Пользователь удален');
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n✅ ГОТОВО! Удалено пользователей: ${users.length}\n`);

    // Показываем кто остался
    const remaining = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });

    console.log('👤 Оставшиеся пользователи:\n');
    remaining.forEach(u => {
      console.log(`  [${u.id}] ${u.firstName} ${u.lastName} (${u.email})`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllExcept35();
