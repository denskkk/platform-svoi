/**
 * POST /api/user/upgrade { accountType: 'basic' }
 * Перехід «Глядач» → «Звичайний» (безкоштовно). Бізнес-акаунт створюється окремою реєстрацією.
 * Повертає новий токен, бо тип акаунту зберігається в JWT.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { generateToken } from '@/lib/auth';
import { setAuthCookie } from '@/lib/cookies';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user: authUser, error } = await requireAuth(request);
    if (error || !authUser) {
      return error || NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
    }

    const userId = Number(authUser.userId);
    const body = await request.json().catch(() => ({}));

    if (body?.accountType !== 'basic') {
      return NextResponse.json({ error: 'Невірний тип акаунту' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
    }
    if (currentUser.accountType !== 'viewer') {
      return NextResponse.json({ error: 'Ви вже маєте цей тип акаунту' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { accountType: 'basic' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        accountType: true,
        city: true,
        avatarUrl: true,
        isVerified: true,
        isAdmin: true,
      },
    });

    const token = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      accountType: updatedUser.accountType,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Тепер у вас звичайний профіль!',
      user: updatedUser,
      token,
    });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('[user/upgrade] Error:', error);
    return NextResponse.json({ error: 'Помилка оновлення акаунту' }, { status: 500 });
  }
}
