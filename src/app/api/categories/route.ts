/**
 * GET /api/categories
 * Отримати всі категорії послуг
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categories as defaultCategories } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let categories = await prisma.category.findMany({
      orderBy: {
        sortOrder: 'asc'
      },
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    });

    // Якщо в БД немає категорій (після очищення) — ініціалізуємо дефолтні
    if (!categories || categories.length === 0) {
      // Створюємо з constants
      const data = defaultCategories.map((c, idx) => ({
        name: c.name,
        slug: c.slug,
        emoji: c.emoji || null,
        description: c.description || null,
        sortOrder: idx + 1,
        isActive: true,
      }));

      // Використаємо createMany з ignoreDuplicates на випадок гонки
      await prisma.category.createMany({ data, skipDuplicates: true });

      // Перечитаємо з БД щоб отримати id та лічильники
      categories = await prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { services: true } }
        }
      });
    }
    
    // Якщо категорій менше ніж 15, оновлюємо їх з constants
    if (categories.length < 15) {
      for (let i = 0; i < defaultCategories.length; i++) {
        const c = defaultCategories[i];
        await prisma.category.upsert({
          where: { slug: c.slug },
          update: {
            name: c.name,
            emoji: c.emoji || null,
            description: c.description || null,
            sortOrder: i + 1,
          },
          create: {
            name: c.name,
            slug: c.slug,
            emoji: c.emoji || null,
            description: c.description || null,
            sortOrder: i + 1,
            isActive: true,
          }
        });
      }
      
      // Перечитаємо оновлені категорії
      categories = await prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { services: true } }
        }
      });
    }

    return NextResponse.json({ categories });

  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
