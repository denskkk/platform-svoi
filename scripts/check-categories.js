const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCategories() {
  console.log('\n=== ПЕРЕВІРКА КАТЕГОРІЙ ===\n');
  
  try {
    // Категорії з бази
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: { services: true }
        }
      }
    });
    
    console.log(`Всього категорій в базі: ${categories.length}\n`);
    
    categories.forEach(cat => {
      console.log(`ID: ${cat.id} | Slug: ${cat.slug} | Назва: ${cat.name} | Послуг: ${cat._count.services}`);
    });
    
    // Послуги з базою
    console.log('\n=== ПОСЛУГИ ===\n');
    
    const services = await prisma.service.findMany({
      take: 20,
      include: {
        category: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log(`Всього послуг: ${await prisma.service.count()}\n`);
    console.log(`Перші ${services.length} послуг:\n`);
    
    services.forEach(service => {
      console.log(`[${service.id}] ${service.title}`);
      console.log(`   CategoryID: ${service.categoryId} | Category: ${service.category?.name} (${service.category?.slug})`);
      console.log(`   User: ${service.user.firstName} ${service.user.lastName}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Помилка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();
