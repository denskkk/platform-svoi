/**
 * GET    /api/favorites                    — список обраних профілів
 * GET    /api/favorites?targetUserId=ID    — чи є профіль в обраному { isFavorite }
 * POST   /api/favorites { targetUserId }   — додати в обране
 * DELETE /api/favorites?targetUserId=ID    — прибрати з обраного
 *
 * Авторизація: httpOnly cookie або заголовок Authorization: Bearer <token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';

export const dynamic = 'force-dynamic';

function parseTargetId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthWithPermission(request, 'VIEW_FAVORITES');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const targetParam = new URL(request.url).searchParams.get('targetUserId');
    if (targetParam !== null) {
      const targetUserId = parseTargetId(targetParam);
      if (!targetUserId) {
        return NextResponse.json({ error: 'Вкажіть користувача' }, { status: 400 });
      }
      const existing = await prisma.favorite.findUnique({
        where: { userId_targetUserId: { userId, targetUserId } },
        select: { id: true },
      });
      return NextResponse.json({ isFavorite: !!existing });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        targetUser: {
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
            businessInfo: { select: { companyName: true, logoUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthWithPermission(request, 'ADD_TO_FAVORITES');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const body = await request.json().catch(() => ({}));
    const targetUserId = parseTargetId(body?.targetUserId);
    if (!targetUserId) {
      return NextResponse.json({ error: 'Вкажіть користувача' }, { status: 400 });
    }
    if (targetUserId === userId) {
      return NextResponse.json({ error: 'Не можна додати себе в обране' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
    if (!target) {
      return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
    }

    await prisma.favorite.upsert({
      where: { userId_targetUserId: { userId, targetUserId } },
      create: { userId, targetUserId },
      update: {},
    });

    return NextResponse.json({ success: true, isFavorite: true, message: 'Додано в обране!' }, { status: 201 });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuthWithPermission(request, 'ADD_TO_FAVORITES');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const targetUserId = parseTargetId(new URL(request.url).searchParams.get('targetUserId'));
    if (!targetUserId) {
      return NextResponse.json({ error: 'Вкажіть користувача' }, { status: 400 });
    }

    await prisma.favorite.deleteMany({ where: { userId, targetUserId } });

    return NextResponse.json({ success: true, isFavorite: false, message: 'Видалено з обраного!' });
  } catch (error) {
    console.error('Delete favorite error:', error);
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
  }
}
