/**
 * Скрипт для перегляду та очищення даних
 * Використання: node scripts/view-and-clean-data.js [action]
 * 
 * Доступні дії:
 *   view-services       - показати всі послуги
 *   view-requests       - показати всі заявки
 *   view-profiles       - показати всі профілі
 *   delete-service ID   - видалити послугу
 *   delete-request ID   - видалити заявку
 *   delete-user ID      - видалити користувача
 *   clean-all           - видалити ВСІ дані (обережно!)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function viewServices() {
  console.log('\n📦 ПОСЛУГИ:\n');
  const services = await prisma.service.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      category: true
    },
    orderBy: { createdAt: 'desc' }
  });

  if (services.length === 0) {
    console.log('  Послуг немає\n');
    return;
  }

  services.forEach((service, i) => {
    console.log(`  ${i + 1}. [ID: ${service.id}] ${service.title}`);
    console.log(`     Автор: ${service.user.firstName} ${service.user.lastName} (ID: ${service.user.id})`);
    console.log(`     Категорія: ${service.category?.name || 'Без категорії'}`);
    console.log(`     Місто: ${service.city}`);
    console.log(`     Ціна: ${service.priceFrom || 'н/д'} - ${service.priceTo || 'н/д'} ${service.priceUnit}`);
    console.log(`     Створено: ${service.createdAt.toLocaleString('uk-UA')}`);
    console.log('');
  });

  console.log(`  Всього послуг: ${services.length}\n`);
}

async function viewRequests() {
  console.log('\n📋 ЗАЯВКИ НА ПОСЛУГИ:\n');
  const requests = await prisma.serviceRequest.findMany({
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      executor: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      responses: {
        include: {
          executor: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (requests.length === 0) {
    console.log('  Заявок немає\n');
    return;
  }

  requests.forEach((request, i) => {
    console.log(`  ${i + 1}. [ID: ${request.id}] ${request.title}`);
    console.log(`     Клієнт: ${request.client.firstName} ${request.client.lastName} (ID: ${request.client.id})`);
    console.log(`     Статус: ${request.status}`);
    console.log(`     Бюджет: ${request.budgetFrom || 'н/д'} - ${request.budgetTo || 'н/д'} грн`);
    console.log(`     Відгуків виконавців: ${request.responses.length}`);
    if (request.executor) {
      console.log(`     Виконавець: ${request.executor.firstName} ${request.executor.lastName} (ID: ${request.executorId})`);
      console.log(`     Узгоджена ціна: ${request.agreedPrice} грн`);
    }
    console.log(`     Створено: ${request.createdAt.toLocaleString('uk-UA')}`);
    console.log('');
  });

  console.log(`  Всього заявок: ${requests.length}\n`);
}

async function viewProfiles() {
  console.log('\n👥 КОРИСТУВАЧІ:\n');
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          services: true,
          serviceRequestsCreated: true,
          serviceRequestsAccepted: true
        }
      },
      businessInfo: true
    },
    orderBy: { createdAt: 'desc' }
  });

  if (users.length === 0) {
    console.log('  Користувачів немає\n');
    return;
  }

  users.forEach((user, i) => {
    console.log(`  ${i + 1}. [ID: ${user.id}] ${user.firstName} ${user.lastName}`);
    console.log(`     Email: ${user.email}`);
    console.log(`     Телефон: ${user.phone || 'не вказано'}`);
    console.log(`     Місто: ${user.city || 'не вказано'}`);
    console.log(`     Тип акаунту: ${user.accountType}`);
    console.log(`     Послуг: ${user._count.services}`);
    console.log(`     Заявок створено: ${user._count.serviceRequestsCreated}`);
    console.log(`     Заявок прийнято: ${user._count.serviceRequestsAccepted}`);
    console.log(`     Адмін: ${user.isAdmin ? 'Так' : 'Ні'}`);
    if (user.businessInfo) {
      console.log(`     Бізнес: ${user.businessInfo.companyName || 'Не вказано'}`);
    }
    console.log(`     Створено: ${user.createdAt.toLocaleString('uk-UA')}`);
    console.log('');
  });

  console.log(`  Всього користувачів: ${users.length}\n`);
}

async function deleteService(id) {
  const serviceId = parseInt(id);
  
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      user: {
        select: { firstName: true, lastName: true }
      }
    }
  });

  if (!service) {
    console.log(`\n❌ Послугу з ID ${serviceId} не знайдено\n`);
    return;
  }

  console.log(`\n🗑️  Видалення послуги:`);
  console.log(`   ${service.title}`);
  console.log(`   Автор: ${service.user.firstName} ${service.user.lastName}\n`);

  await prisma.service.delete({
    where: { id: serviceId }
  });

  console.log(`✅ Послугу успішно видалено!\n`);
}

async function deleteRequest(id) {
  const requestId = parseInt(id);
  
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      client: {
        select: { firstName: true, lastName: true }
      },
      responses: true
    }
  });

  if (!request) {
    console.log(`\n❌ Заявку з ID ${requestId} не знайдено\n`);
    return;
  }

  console.log(`\n🗑️  Видалення заявки:`);
  console.log(`   ${request.title}`);
  console.log(`   Клієнт: ${request.client.firstName} ${request.client.lastName}`);
  console.log(`   Відгуків: ${request.responses.length}\n`);

  // Спочатку видаляємо відгуки
  await prisma.requestResponse.deleteMany({
    where: { requestId }
  });

  // Потім саму заявку
  await prisma.serviceRequest.delete({
    where: { id: requestId }
  });

  console.log(`✅ Заявку та всі пов'язані відгуки успішно видалено!\n`);
}

async function deleteUser(id) {
  const userId = parseInt(id);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          services: true,
          clientRequests: true,
          executorRequests: true,
          sentMessages: true,
          receivedMessages: true
        }
      }
    }
  });

  if (!user) {
    console.log(`\n❌ Користувача з ID ${userId} не знайдено\n`);
    return;
  }

  console.log(`\n🗑️  Видалення користувача:`);
  console.log(`   ${user.firstName} ${user.lastName} (${user.email})`);
  console.log(`   Послуг: ${user._count.services}`);
  console.log(`   Заявок як клієнт: ${user._count.clientRequests}`);
  console.log(`   Заявок як виконавець: ${user._count.executorRequests}`);
  console.log(`   Повідомлень: ${user._count.sentMessages + user._count.receivedMessages}\n`);

  console.log('⚠️  УВАГА: Це видалить користувача та ВСІ пов\'язані дані!\n');

  // Видаляємо все пов'язане з користувачем
  await prisma.review.deleteMany({ where: { OR: [{ reviewerId: userId }, { reviewedId: userId }] } });
  await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
  await prisma.conversation.deleteMany({ where: { OR: [{ user1Id: userId }, { user2Id: userId }] } });
  await prisma.requestResponse.deleteMany({ where: { userId } });
  await prisma.serviceRequestResponse.deleteMany({ where: { executorId: userId } });
  
  // Заявки де він виконавець
  await prisma.serviceRequest.updateMany({
    where: { executorId: userId },
    data: { executorId: null }
  });
  
  // Його заявки як клієнт
  const clientRequests = await prisma.serviceRequest.findMany({
    where: { clientId: userId }
  });
  
  for (const req of clientRequests) {
    await prisma.requestResponse.deleteMany({ where: { requestId: req.id } });
  }
  
  await prisma.serviceRequest.deleteMany({ where: { clientId: userId } });
  
  // Послуги
  await prisma.service.deleteMany({ where: { userId } });
  
  // Бізнес інфо
  await prisma.businessInfo.deleteMany({ where: { userId } });
  
  // Самого користувача
  await prisma.user.delete({ where: { id: userId } });

  console.log(`✅ Користувача та всі пов'язані дані успішно видалено!\n`);
}

async function cleanAll() {
  console.log('\n⚠️  ⚠️  ⚠️  УВАГА ⚠️  ⚠️  ⚠️\n');
  console.log('Це видалить ВСІ дані з бази даних!\n');
  console.log('Натисніть Ctrl+C щоб скасувати...\n');
  
  // Пауза 3 секунди
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Видалення даних...\n');

  await prisma.review.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.requestResponse.deleteMany({});
  await prisma.serviceRequest.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.businessInfo.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.category.deleteMany({});

  console.log('✅ Всі дані видалено!\n');
}

async function main() {
  const args = process.argv.slice(2);
  const action = args[0];
  const id = args[1];

  try {
    switch (action) {
      case 'view-services':
        await viewServices();
        break;
      
      case 'view-requests':
        await viewRequests();
        break;
      
      case 'view-profiles':
        await viewProfiles();
        break;
      
      case 'delete-service':
        if (!id) {
          console.log('\n❌ Вкажіть ID послуги: node scripts/view-and-clean-data.js delete-service ID\n');
          break;
        }
        await deleteService(id);
        break;
      
      case 'delete-request':
        if (!id) {
          console.log('\n❌ Вкажіть ID заявки: node scripts/view-and-clean-data.js delete-request ID\n');
          break;
        }
        await deleteRequest(id);
        break;
      
      case 'delete-user':
        if (!id) {
          console.log('\n❌ Вкажіть ID користувача: node scripts/view-and-clean-data.js delete-user ID\n');
          break;
        }
        await deleteUser(id);
        break;
      
      case 'clean-all':
        await cleanAll();
        break;
      
      default:
        console.log('\n📖 Використання:');
        console.log('  node scripts/view-and-clean-data.js [дія]\n');
        console.log('Доступні дії:');
        console.log('  view-services          - показати всі послуги');
        console.log('  view-requests          - показати всі заявки');
        console.log('  view-profiles          - показати всі профілі');
        console.log('  delete-service ID      - видалити послугу');
        console.log('  delete-request ID      - видалити заявку');
        console.log('  delete-user ID         - видалити користувача');
        console.log('  clean-all              - видалити ВСІ дані (обережно!)\n');
    }
  } catch (error) {
    console.error('\n❌ Помилка:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
