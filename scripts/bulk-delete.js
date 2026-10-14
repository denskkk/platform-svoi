/**
 * Скрипт для масового видалення даних
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteServices() {
  console.log('\n🗑️  Видалення послуг ID: 29, 28, 27...\n');
  
  const services = await prisma.service.findMany({
    where: {
      id: { in: [29, 28, 27] }
    },
    include: {
      user: {
        select: { firstName: true, lastName: true }
      }
    }
  });

  for (const service of services) {
    console.log(`  Видалення: [${service.id}] ${service.title} (${service.user.firstName} ${service.user.lastName})`);
  }

  await prisma.service.deleteMany({
    where: {
      id: { in: [29, 28, 27] }
    }
  });

  console.log(`\n✅ Видалено ${services.length} послуг\n`);
}

async function deleteAllRequests() {
  console.log('\n🗑️  Видалення всіх заявок...\n');
  
  // Спочатку видаляємо всі відгуки на заявки
  const responsesCount = await prisma.requestResponse.count();
  await prisma.requestResponse.deleteMany({});
  console.log(`  Видалено відгуків: ${responsesCount}`);
  
  // Потім видаляємо всі заявки
  const requestsCount = await prisma.serviceRequest.count();
  await prisma.serviceRequest.deleteMany({});
  console.log(`  Видалено заявок: ${requestsCount}`);
  
  console.log(`\n✅ Всі заявки видалено\n`);
}

async function deleteUsersExceptMaksym() {
  console.log('\n🗑️  Видалення всіх користувачів крім Максим Макарчук (ID: 35)...\n');
  
  const users = await prisma.user.findMany({
    where: {
      id: { not: 35 }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  });

  console.log(`  Знайдено користувачів для видалення: ${users.length}\n`);

  for (const user of users) {
    console.log(`  Видалення: [${user.id}] ${user.firstName} ${user.lastName} (${user.email})`);
    
    // Видаляємо все пов'язане
    await prisma.review.deleteMany({ where: { OR: [{ reviewerId: user.id }, { reviewedId: user.id }] } });
    await prisma.message.deleteMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } });
    await prisma.conversation.deleteMany({ where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] } });
    await prisma.requestResponse.deleteMany({ where: { userId: user.id } });
    await prisma.serviceRequestResponse.deleteMany({ where: { executorId: user.id } });
    
    // Оновлюємо заявки де він виконавець
    await prisma.serviceRequest.updateMany({
      where: { executorId: user.id },
      data: { executorId: null }
    });
    
    // Видаляємо відгуки на його заявки
    const userRequests = await prisma.serviceRequest.findMany({
      where: { clientId: user.id },
      select: { id: true }
    });
    
    for (const req of userRequests) {
      await prisma.requestResponse.deleteMany({ where: { requestId: req.id } });
    }
    
    // Видаляємо його заявки
    await prisma.serviceRequest.deleteMany({ where: { clientId: user.id } });
    
    // Видаляємо його послуги
    await prisma.service.deleteMany({ where: { userId: user.id } });
    
    // Видаляємо бізнес інфо
    await prisma.businessInfo.deleteMany({ where: { userId: user.id } });
    
    // Видаляємо користувача
    await prisma.user.delete({ where: { id: user.id } });
  }

  console.log(`\n✅ Видалено ${users.length} користувачів\n`);
  
  // Показуємо що залишилось
  const remaining = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  });
  
  console.log('👤 Користувачі що залишились:\n');
  remaining.forEach(u => {
    console.log(`  [${u.id}] ${u.firstName} ${u.lastName} (${u.email})`);
  });
  console.log('');
}

async function main() {
  try {
    console.log('\n🚀 Початок масового видалення...\n');
    
    // 1. Видаляємо послуги 29, 28, 27
    await deleteServices();
    
    // 2. Видаляємо всі заявки
    await deleteAllRequests();
    
    // 3. Видаляємо всіх користувачів крім Максима (ID: 35)
    await deleteUsersExceptMaksym();
    
    console.log('✅ Готово!\n');
    
  } catch (error) {
    console.error('\n❌ Помилка:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
