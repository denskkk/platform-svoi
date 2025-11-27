/**
 * Скрипт для просмотра всех пользователей в базе данных
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function viewAllUsers() {
  try {
    console.log('\n👥 СПИСОК ВСЕХ ПОЛЬЗОВАТЕЛЕЙ В БАЗЕ ДАННЫХ\n');
    console.log('='.repeat(80));
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        accountType: true,
        createdAt: true,
        isAdmin: true,
        _count: {
          select: {
            services: true,
            clientRequests: true,
            executorRequests: true,
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    if (users.length === 0) {
      console.log('\n❌ База данных пуста - пользователей нет\n');
      return;
    }

    console.log(`\nВсего пользователей: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   👤 Имя: ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Роль: ${user.role}${user.isAdmin ? ' (ADMIN)' : ''}`);
      console.log(`   💼 Тип аккаунта: ${user.accountType}`);
      console.log(`   📅 Создан: ${user.createdAt.toLocaleDateString('uk-UA')}`);
      console.log(`   📊 Услуг: ${user._count.services} | Заявок клиента: ${user._count.clientRequests} | Заявок исполнителя: ${user._count.executorRequests}`);
      console.log('   ' + '-'.repeat(76));
    });

    console.log('\n📈 СТАТИСТИКА ПО РОЛЯМ:\n');
    
    const stats = {
      admin: users.filter(u => u.isAdmin).length,
      business: users.filter(u => u.role === 'business').length,
      user: users.filter(u => u.role === 'user').length,
    };

    console.log(`   👑 Админов: ${stats.admin}`);
    console.log(`   🏢 Бизнес: ${stats.business}`);
    console.log(`   👤 Обычных: ${stats.user}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Для удаления пользователей используйте: node scripts/delete-users.js\n');

  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

viewAllUsers();
