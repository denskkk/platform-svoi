/**
 * GET /api/users
 * Пошук та перелік користувачів (для каталогу людей)
 * Публічний (обмежені поля)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const city = searchParams.get('city')?.trim();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const skip = (page - 1) * limit;

    const where: any = {
      role: { in: ['user','business'] },
    };

    if (city) {
      where.city = city;
    }

    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { profession: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          city: true,
          profession: true,
          avgRating: true,
          totalReviews: true,
          isVerified: true,
          accountType: true,
          role: true,
          ucmVerified: true,
          businessInfo: {
            select: {
              companyName: true,
              logoUrl: true,
            }
          },
        } as any,
        orderBy: [
          { avgRating: 'desc' },
          { totalReviews: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('List/search users error:', error);
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
  }
}
