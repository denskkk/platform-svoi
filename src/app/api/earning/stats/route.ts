import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { user: authUser, error } = await requireAuth(request);

    if (error || !authUser) {
      return error || NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
    }

    const userId = authUser.userId;

    // Основні дані користувача
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        avgRating: true,
        totalReviews: true,
        balanceUcm: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
    }

    // Підрахунок рефералів (користувачі, які мають referredById = userId)
    const referralsCount = await prisma.user.count({ where: { referredById: userId } });

    // Кількість створених сервісів
    const servicesCount = await prisma.service.count({ where: { userId } });

    // Відгуки
    const reviewsGivenCount = await prisma.review.count({ where: { reviewerId: userId } });
    const reviewsReceivedCount = await prisma.review.count({ where: { reviewedId: userId } });

    // Дні від реєстрації
    const now = new Date();
    const daysSinceRegistration = Math.max(0, Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      referralsCount,
      servicesCount,
      reviewsGivenCount,
      reviewsReceivedCount,
      avgRating: Number(user.avgRating),
      totalReviews: user.totalReviews,
      daysSinceRegistration,
      balanceUcm: Number(user.balanceUcm)
    });
  } catch (err: any) {
    console.error('[earning/stats] Error:', err);
    return NextResponse.json({ error: 'Помилка отримання статистики' }, { status: 500 });
  }
}
