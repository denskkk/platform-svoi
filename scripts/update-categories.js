/**
 * Скрипт для оновлення категорій через Prisma
 * Використовує DATABASE_URL з .env
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  { name: 'Все для дому', slug: 'vse-dlya-domu', emoji: '🏠', description: 'Ремонт, прибирання, майстри', sortOrder: 1 },
  { name: 'Все для Авто', slug: 'vse-dlya-auto', emoji: '🚗', description: 'Авто, мото, велосипеди, самокати', sortOrder: 2 },
  { name: 'Краса', slug: 'krasa', emoji: '💅', description: 'Салони, перукарі, косметологи', sortOrder: 3 },
  { name: 'Освіта', slug: 'osvita', emoji: '📚', description: 'Курси, репетитори, навчання', sortOrder: 4 },
  { name: 'Розваги та хоббі', slug: 'rozvagy-ta-hobbi', emoji: '🎨', description: 'Спорт, дозвілля, творчість', sortOrder: 5 },
  { name: 'Все для дітей', slug: 'vse-dlya-ditey', emoji: '👶', description: 'Садочки, секції, іграшки', sortOrder: 6 },
  { name: 'Магазини онлайн', slug: 'magazyny-online', emoji: '🛒', description: 'Інтернет-магазини', sortOrder: 7 },
  { name: 'Магазини офлайн', slug: 'magazyny-offline', emoji: '🏪', description: 'Фізичні магазини', sortOrder: 8 },
  { name: 'Все для домашніх тварин', slug: 'vse-dlya-tvaryn', emoji: '🐾', description: 'Ветеринари, зоомагазини', sortOrder: 9 },
  { name: 'Ресторани, готелі', slug: 'restorany-goteli', emoji: '🍽️', description: 'HoReCa, кейтеринг', sortOrder: 10 },
  { name: 'Агенство з продажу Нерухомості', slug: 'neruhomist', emoji: '🏢', description: 'Продаж, оренда житла', sortOrder: 11 },
  { name: 'Агенство з продажу Рухомого майна', slug: 'ruhome-mayno', emoji: '🚛', description: 'Авто, техніка, обладнання', sortOrder: 12 },
  { name: 'Заявки на виконання задач онлайн та офлайн', slug: 'zayavky-na-zadachi', emoji: '✅', description: 'Онлайн та офлайн послуги', sortOrder: 13 },
  { name: 'Дошка подій та оголошень', slug: 'podiyi-ta-ogoloshennya', emoji: '📢', description: 'Події, новини, оголошення', sortOrder: 14 },
  { name: 'Все для обслуговування та розвитку вашого бізнесу', slug: 'vse-dlya-biznesu', emoji: '💼', description: 'B2B послуги для бізнесу', sortOrder: 15 },
];

async function updateCategories() {
  try {
    console.log('📝 Оновлення категорій...\n');

    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          emoji: category.emoji,
          description: category.description,
          sortOrder: category.sortOrder,
          isActive: true,
        },
        create: {
          name: category.name,
          slug: category.slug,
          emoji: category.emoji,
          description: category.description,
          sortOrder: category.sortOrder,
          isActive: true,
        }
      });
      console.log(`✅ ${category.emoji} ${category.name}`);
    }

    const totalCategories = await prisma.category.count();
    console.log(`\n✅ Оновлено! Всього категорій: ${totalCategories}`);

  } catch (error) {
    console.error('❌ Помилка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateCategories();
