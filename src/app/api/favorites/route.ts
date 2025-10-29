/**
 * GET /api/favorites
 * Отримати обрані профілі користувача
 * 
 * POST /api/favorites
 * Додати в обране
 * 
 * DELETE /api/favorites
 * Видалити з обраного
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// GET - Отримати обрані
export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const token = getTokenFromHeader(authorization);

    if (!token) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Невірний токен' },
        { status: 401 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: payload.userId
      },
      include: {
        targetUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            city: true,
            bio: true,
            avgRating: true,
            totalReviews: true,
            isVerified: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ favorites });

  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

// POST - Додати в обране
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const token = getTokenFromHeader(authorization);

    if (!token) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Невірний токен' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Вкажіть користувача' },
        { status: 400 }
      );
    }

    // Перевірка чи вже в обраному
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_targetUserId: {
          userId: payload.userId,
          targetUserId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Вже в обраному' },
        { status: 409 }
      );
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: payload.userId,
        targetUserId,
      },
      include: {
        targetUser: {
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
      message: 'Додано в обране!',
      favorite,
    }, { status: 201 });

  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

// DELETE - Видалити з обраного
export async function DELETE(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const token = getTokenFromHeader(authorization);

    if (!token) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Невірний токен' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Вкажіть користувача' },
        { status: 400 }
      );
    }

    await prisma.favorite.delete({
      where: {
        userId_targetUserId: {
          userId: payload.userId,
          targetUserId: parseInt(targetUserId)
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Видалено з обраного!',
    });

  } catch (error) {
    console.error('Delete favorite error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
