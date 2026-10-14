/**
 * POST /api/auth/delete-account
 * Видалення власного акаунта та пов'язаних даних (потрібне підтвердження паролем).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { comparePassword } from '@/lib/auth';
import { removeAuthCookie } from '@/lib/cookies';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const userId = Number(user.userId);

    const limit = checkRateLimit(`delete-account:${userId}`, {
      interval: 15 * 60 * 1000,
      maxRequests: 5,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Забагато спроб. Спробуйте пізніше.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const password = String(body?.password || '');
    if (!password) {
      return NextResponse.json({ error: 'Введіть пароль для підтвердження' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, isAdmin: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
    }
    if (dbUser.isAdmin) {
      return NextResponse.json(
        { error: 'Акаунт адміністратора видаляється через підтримку.' },
        { status: 403 }
      );
    }

    const valid = await comparePassword(password, dbUser.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Невірний пароль' }, { status: 401 });
    }

    // Усі пов'язані записи (послуги, повідомлення, відгуки, сесії тощо) видаляються каскадно
    await prisma.user.delete({ where: { id: userId } });

    const response = NextResponse.json({
      success: true,
      message: 'Акаунт та пов’язані дані видалено.',
    });
    removeAuthCookie(response);
    return response;
  } catch (e) {
    console.error('[delete-account] error', e);
    return NextResponse.json(
      { error: 'Не вдалося видалити акаунт. Зверніться до підтримки.' },
      { status: 500 }
    );
  }
}
