/**
 * GET /api/users/top
 * Отримати топ користувачів за рейтингом
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Позначаємо маршрут як динамічний
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '4');

    const selectFields: any = {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      city: true,
      profession: true,
      bio: true,
      avgRating: true,
      totalReviews: true,
      isVerified: true,
      role: true,
      accountType: true,
      businessInfo: {
        select: {
          companyName: true,
          logoUrl: true,
        }
      },
      _count: {
        select: {
          services: true
        }
      }
    };

    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['user', 'business']
        },
        totalReviews: {
          gte: 0
        }
      },
      select: selectFields,
      orderBy: [
        { avgRating: 'desc' },
        { totalReviews: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
    });

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Get top users error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
