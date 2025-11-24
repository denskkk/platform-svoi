const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Створення адмін акаунту...');
    
    // Хешувати пароль
    const passwordHash = await bcrypt.hash('sviyadmin1354', 10);
    
    // Створити або оновити користувача
    const admin = await prisma.user.upsert({
      where: { email: 'admin@gmail.com' },
      update: {
        passwordHash: passwordHash,
        isAdmin: true,
        isVerified: true,
        isActive: true
      },
      create: {
        email: 'admin@gmail.com',
        firstName: 'Admin',
        lastName: 'Platform',
        passwordHash: passwordHash,
        isAdmin: true,
        isVerified: true,
        isActive: true,
        accountType: 'basic'
      }
    });
    
    console.log('✅ Адмін акаунт створено/оновлено:');
    console.log('   Email: admin@gmail.com');
    console.log('   Пароль: sviyadmin1354');
    console.log('   ID:', admin.id);
    console.log('   isAdmin:', admin.isAdmin);
    
    // Показати всіх адміністраторів
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isAdmin: true
      }
    });
    
    console.log('\n📋 Всі адміністратори:');
    console.table(admins);
    
    console.log('\n🎉 Готово! Тепер:');
    console.log('1. Перезапустіть сервер: pm2 restart sviy-web');
    console.log('2. Зайдіть на сайт з admin@gmail.com / sviyadmin1354');
    console.log('3. Перейдіть на /admin');
    
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
