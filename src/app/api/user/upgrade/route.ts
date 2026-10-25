/**
 * POST /api/user/upgrade { accountType: 'basic' }
 * Перехід «Глядач» → «Звичайний» (безкоштовно). Бізнес-акаунт створюється окремою реєстрацією.
 * Повертає новий токен, бо тип акаунту зберігається в JWT.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { hashToken } from '@/lib/auth';
import { setAuthCookie } from '@/lib/cookies';
import { authenticateRequestToken, buildTokens } from '@/lib/session';

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

    const auth = await authenticateRequestToken(request);
    if (!auth.ok) {
      return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
    }
    const session = { id: auth.sessionId };

    const { updatedUser, token } = await prisma.$transaction(async (tx: typeof prisma) => {
      const user = await tx.user.update({
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

      const { token: nextToken } = buildTokens(user, session.id);
      const sessionUpdate = await tx.session.updateMany({
        where: { id: session.id, isActive: true },
        data: { tokenHash: hashToken(nextToken) },
      });
      if (sessionUpdate.count !== 1) {
        throw new Error('Active session not found for account upgrade');
      }

      return { updatedUser: user, token: nextToken };
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
