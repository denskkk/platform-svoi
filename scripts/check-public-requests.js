/**
 * Скрипт для перевірки публічних заявок в базі даних
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPublicRequests() {
  console.log('\n📋 Перевірка публічних заявок...\n');
  
  try {
    // Всі заявки
    const allRequests = await prisma.serviceRequest.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        isPublic: true,
        isPromoted: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('📊 Останні 10 заявок:\n');
    allRequests.forEach((req, i) => {
      console.log(`  ${i + 1}. [ID: ${req.id}] ${req.title}`);
      console.log(`     Клієнт: ${req.client.firstName} ${req.client.lastName} (ID: ${req.client.id})`);
      console.log(`     Статус: ${req.status}`);
      console.log(`     Публічна: ${req.isPublic ? '✅ ТАК' : '❌ НІ'}`);
      console.log(`     Просувається: ${req.isPromoted ? '⭐ ТАК' : 'НІ'}`);
      console.log(`     Створена: ${req.createdAt.toLocaleString('uk-UA')}`);
      console.log('');
    });

    // Публічні заявки
    const publicRequests = await prisma.serviceRequest.findMany({
      where: {
        isPublic: true
      },
      select: {
        id: true,
        title: true,
        status: true,
        isPromoted: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n✅ Всього публічних заявок: ${publicRequests.length}\n`);

    // Публічні заявки що мають відображатися (не завершені)
    const activePublicRequests = await prisma.serviceRequest.findMany({
      where: {
        isPublic: true,
        status: {
          notIn: ['completed', 'paid', 'cancelled', 'rejected']
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        isPromoted: true
      }
    });

    console.log(`📢 Активних публічних заявок (які мають відображатися): ${activePublicRequests.length}\n`);
    
    if (activePublicRequests.length > 0) {
      console.log('Список активних публічних заявок:\n');
      activePublicRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. [ID: ${req.id}] ${req.title} (${req.status})${req.isPromoted ? ' ⭐' : ''}`);
      });
      console.log('');
    }

    // Статистика по статусам
    const statuses = await prisma.serviceRequest.groupBy({
      by: ['status', 'isPublic'],
      _count: true,
      orderBy: {
        _count: {
          status: 'desc'
        }
      }
    });

    console.log('\n📈 Статистика заявок по статусам:\n');
    statuses.forEach(stat => {
      console.log(`  ${stat.status} (публічна: ${stat.isPublic ? 'так' : 'ні'}): ${stat._count} заявок`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ Помилка:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPublicRequests();
