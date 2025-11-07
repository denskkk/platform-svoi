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

// POST - Створити відгук
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthWithPermission(request, 'LEAVE_REVIEW');
    if (auth.error) return auth.error;

    const body = await request.json();
    const { reviewedId, rating, comment } = body;

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

    // Перевірка чи відгук вже існує
    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_reviewedId: {
          reviewerId: auth.user.userId,
          reviewedId: reviewedId
        }
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Ви вже залишали відгук цьому користувачу' },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: auth.user.userId,
        reviewedId,
        rating,
        comment,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          }
        }
      }
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

    if (!userId) {
      return NextResponse.json(
        { error: 'Вкажіть userId' },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        reviewedId: parseInt(userId)
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isVerified: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ reviews });

  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
