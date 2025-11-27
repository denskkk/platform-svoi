/**
 * Интерактивный скрипт для удаления пользователей
 * Удаляет пользователя вместе со всеми связанными данными:
 * - Услугами (services)
 * - Заявками (serviceRequest)
 * - Отзывами (reviews)
 * - Сообщениями (messages)
 * - Бизнес информацией (businessInfo)
 * - UCM транзакциями
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function showUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isAdmin: true,
      _count: {
        select: {
          services: true,
          serviceRequestsCreated: true,
          serviceRequestsAccepted: true,
        }
      }
    },
    orderBy: { id: 'asc' }
  });

  console.log('\n👥 ПОЛЬЗОВАТЕЛИ В БАЗЕ:\n');
  console.log('='.repeat(70));
  
  users.forEach(user => {
    const adminBadge = user.isAdmin ? '👑 ' : '';
    console.log(`ID: ${user.id} | ${adminBadge}${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email} | Роль: ${user.role}`);
    console.log(`   Услуг: ${user._count.services} | Заявок: ${user._count.serviceRequestsCreated}`);
    console.log('-'.repeat(70));
  });

  return users;
}

async function deleteUserWithRelations(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      _count: {
        select: {
          services: true,
          serviceRequestsCreated: true,
          serviceRequestsAccepted: true,
          reviewsGiven: true,
          reviewsReceived: true,
        }
      }
    }
  });

  if (!user) {
    console.log(`\n❌ Пользователь с ID ${userId} не найден\n`);
    return false;
  }

  console.log(`\n⚠️  УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ:\n`);
  console.log(`   👤 ${user.firstName} ${user.lastName} (${user.email})`);
  console.log(`   🗑️  Будет удалено:`);
  console.log(`      - Услуг: ${user._count.services}`);
  console.log(`      - Заявок создано: ${user._count.serviceRequestsCreated}`);
  console.log(`      - Заявок принято: ${user._count.serviceRequestsAccepted}`);
  console.log(`      - Отзывов дано: ${user._count.reviewsGiven}`);
  console.log(`      - Отзывов получено: ${user._count.reviewsReceived}`);

  const confirm = await question('\n❓ Подтвердите удаление (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('\n❌ Удаление отменено\n');
    return false;
  }

  console.log('\n🗑️  Начинаем удаление...\n');

  try {
    // 1. Удаляем отзывы
    const reviewsDeleted = await prisma.review.deleteMany({
      where: {
        OR: [
          { reviewerId: userId },
          { reviewedId: userId }
        ]
      }
    });
    console.log(`   ✓ Отзывы: ${reviewsDeleted.count}`);

    // 2. Удаляем сообщения
    const messagesDeleted = await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });
    console.log(`   ✓ Сообщения: ${messagesDeleted.count}`);

    // 3. Удаляем разговоры
    const conversationsDeleted = await prisma.conversation.deleteMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });
    console.log(`   ✓ Разговоры: ${conversationsDeleted.count}`);

    // 4. Удаляем UCM транзакции
    const ucmDeleted = await prisma.ucmTransaction.deleteMany({
      where: { userId: userId }
    });
    console.log(`   ✓ UCM транзакции: ${ucmDeleted.count}`);

    // 5. Ответы на заявки (как исполнитель)
    const responsesDeleted = await prisma.serviceRequestResponse.deleteMany({
      where: { executorId: userId }
    });
    console.log(`   ✓ Ответы на заявки: ${responsesDeleted.count}`);

    // 6. Удаляем ответы на его заявки
    const userRequests = await prisma.serviceRequest.findMany({
      where: { clientId: userId },
      select: { id: true }
    });

    let requestResponsesDeleted = 0;
    for (const req of userRequests) {
      const deleted = await prisma.serviceRequestResponse.deleteMany({
        where: { requestId: req.id }
      });
      requestResponsesDeleted += deleted.count;
    }
    console.log(`   ✓ Ответы на его заявки: ${requestResponsesDeleted}`);

    // 7. Удаляем его заявки
    const clientRequestsDeleted = await prisma.serviceRequest.deleteMany({
      where: { clientId: userId }
    });
    console.log(`   ✓ Заявки клиента: ${clientRequestsDeleted.count}`);

    // 8. Удаляем услуги
    const servicesDeleted = await prisma.service.deleteMany({
      where: { userId: userId }
    });
    console.log(`   ✓ Услуги: ${servicesDeleted.count}`);

    // 9. Удаляем бизнес информацию
    const businessDeleted = await prisma.businessInfo.deleteMany({
      where: { userId: userId }
    });
    console.log(`   ✓ Бизнес информация: ${businessDeleted.count}`);

    // 10. Удаляем сессии
    const sessionsDeleted = await prisma.session.deleteMany({
      where: { userId: userId }
    });
    console.log(`   ✓ Сессии: ${sessionsDeleted.count}`);

    // 11. Наконец, удаляем самого пользователя
    await prisma.user.delete({
      where: { id: userId }
    });
    console.log(`   ✓ Пользователь удален`);

    console.log(`\n✅ Пользователь ${user.firstName} ${user.lastName} успешно удален!\n`);
    return true;

  } catch (error) {
    console.error('\n❌ Ошибка при удалении:', error.message);
    console.error(error);
    return false;
  }
}

async function deleteMultipleUsers(userIds) {
  console.log(`\n🗑️  МАССОВОЕ УДАЛЕНИЕ ${userIds.length} ПОЛЬЗОВАТЕЛЕЙ\n`);
  
  let deleted = 0;
  let failed = 0;

  for (const userId of userIds) {
    const success = await deleteUserWithRelations(userId);
    if (success) {
      deleted++;
    } else {
      failed++;
    }
  }

  console.log('\n📊 ИТОГ:');
  console.log(`   ✅ Удалено: ${deleted}`);
  console.log(`   ❌ Не удалено: ${failed}\n`);
}

async function main() {
  try {
    console.log('\n🗑️  УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЕЙ\n');
    console.log('='.repeat(70));

    const users = await showUsers();

    if (users.length === 0) {
      console.log('\n❌ В базе нет пользователей\n');
      rl.close();
      return;
    }

    console.log('\n💡 Варианты:');
    console.log('   - Введите ID пользователя (например: 5)');
    console.log('   - Введите несколько ID через запятую (например: 1,2,3)');
    console.log('   - Введите "all" для удаления ВСЕХ пользователей');
    console.log('   - Введите "exit" для выхода\n');

    const input = await question('❓ Введите команду: ');

    if (input.toLowerCase() === 'exit') {
      console.log('\n👋 Выход\n');
      rl.close();
      return;
    }

    if (input.toLowerCase() === 'all') {
      const confirm = await question('\n⚠️  УДАЛИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ? (yes/no): ');
      if (confirm.toLowerCase() === 'yes') {
        const userIds = users.map(u => u.id);
        await deleteMultipleUsers(userIds);
      } else {
        console.log('\n❌ Удаление отменено\n');
      }
      rl.close();
      return;
    }

    // Парсим ID
    const userIds = input.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (userIds.length === 0) {
      console.log('\n❌ Неверный формат. Введите числа.\n');
      rl.close();
      return;
    }

    if (userIds.length === 1) {
      await deleteUserWithRelations(userIds[0]);
    } else {
      await deleteMultipleUsers(userIds);
    }

  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    console.error(error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
