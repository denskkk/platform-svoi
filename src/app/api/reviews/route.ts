/**
 * POST /api/reviews
 * Створити відгук
 * 
 * GET /api/reviews?userId=[id]
 * Отримати відгуки користувача
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { Decimal } from '@prisma/client/runtime/library';

// POST - Створити відгук
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthWithPermission(request, 'LEAVE_REVIEW');
    if (auth.error) return auth.error;

    const body = await request.json();
    const { reviewedId, serviceRequestId, rating, comment, photos = [] } = body;

    // Валідація
    if (!reviewedId || !rating) {
      return NextResponse.json(
        { error: 'Вкажіть користувача та оцінку' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Оцінка має бути від 1 до 5' },
        { status: 400 }
      );
    }

    if (auth.user.userId === reviewedId) {
      return NextResponse.json(
        { error: 'Неможливо залишити відгук собі' },
        { status: 400 }
      );
    }

    // Якщо є serviceRequestId, перевірити права
    if (serviceRequestId) {
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: serviceRequestId }
      });

      if (!serviceRequest) {
        return NextResponse.json(
          { error: 'Заявку не знайдено' },
          { status: 404 }
        );
      }

      const isClient = serviceRequest.clientId === auth.user.userId && serviceRequest.executorId === reviewedId;
      const isExecutor = serviceRequest.executorId === auth.user.userId && serviceRequest.clientId === reviewedId;

      if (!isClient && !isExecutor) {
        return NextResponse.json(
          { error: 'Ви не можете залишити відгук за цією заявкою' },
          { status: 403 }
        );
      }

      if (!serviceRequest.isPaid) {
        return NextResponse.json(
          { error: 'Відгук можна залишити тільки після оплати' },
          { status: 400 }
        );
      }

      const existingReview = await prisma.review.findFirst({
        where: {
          reviewerId: auth.user.userId,
          reviewedId,
          serviceRequestId
        }
      });

      if (existingReview) {
        return NextResponse.json(
          { error: 'Ви вже залишили відгук за цією заявкою' },
          { status: 400 }
        );
      }
    }

    // Створити відгук з оновленням рейтингу
    const review = await prisma.$transaction(async (tx: any) => {
      const newReview = await tx.review.create({
        data: {
          reviewerId: auth.user.userId,
          reviewedId,
          serviceRequestId: serviceRequestId || null,
          rating,
          comment: comment || null,
          photos: Array.isArray(photos) ? photos : []
        },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          },
          serviceRequest: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      // Оновити рейтинг користувача
      const allReviews = await tx.review.findMany({
        where: {
          reviewedId,
          isVisible: true
        },
        select: { rating: true }
      });

      const avgRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;

      await tx.user.update({
        where: { id: reviewedId },
        data: {
          avgRating: new Decimal(avgRating.toFixed(2)),
          totalReviews: allReviews.length
        }
      });

      // Сповістити користувача
      await tx.notification.create({
        data: {
          userId: reviewedId,
          type: 'new_review',
          title: 'Новий відгук',
          message: `Ви отримали ${rating}-зірковий відгук`,
          relatedEntityType: 'Review',
          relatedEntityId: newReview.id
        }
      });

      return newReview;
    });

    return NextResponse.json({
      success: true,
      message: 'Відгук створено!',
      review,
    }, { status: 201 });

  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

// GET - Отримати відгуки
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { error: 'Вкажіть userId' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const where: any = {
      reviewedId: parseInt(userId),
      isVisible: true
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              city: true,
              isVerified: true
            }
          },
          serviceRequest: {
            select: {
              id: true,
              title: true,
              category: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ]);

    // Розрахувати статистику рейтингів
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        reviewedId: parseInt(userId),
        isVisible: true
      },
      _count: {
        rating: true
      }
    });

    const stats: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    ratingDistribution.forEach((r: any) => {
      stats[r.rating] = r._count.rating;
    });

    return NextResponse.json({
      reviews,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
