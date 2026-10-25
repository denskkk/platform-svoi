/**
 * POST /api/auth/logout
 * Вихід користувача: видаляє httpOnly cookie і (опційно) сесію
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthCookie, getRefreshCookie } from '@/lib/cookies';
import { extractSessionId, hashToken } from '@/lib/auth';
import { removeAuthCookie } from '@/lib/cookies';

export async function POST(request: NextRequest) {
  try {
    const tokens = [
      getAuthCookie(request),
      getRefreshCookie(request),
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, ''),
    ].filter((token): token is string => Boolean(token));

    // Створюємо відповідь одразу, cookie будемо видаляти на ній
    const response = NextResponse.json({ success: true });

    // Видаляємо cookie незалежно від наявності сесії
    removeAuthCookie(response);

    // Revoke the matching session so a copied Bearer token cannot remain usable.
    if (tokens.length > 0) {
      const sessionIds = Array.from(new Set(
        tokens.map(extractSessionId).filter((sid): sid is string => Boolean(sid))
      ));
      await prisma.session.updateMany({
        where: {
          OR: [
            ...(sessionIds.length ? [{ id: { in: sessionIds } }] : []),
            ...tokens.flatMap((token) => [
              { tokenHash: hashToken(token) },
              { refreshTokenHash: hashToken(token) },
            ]),
          ],
        },
        data: { isActive: false },
      });
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ success: false }, { status: 500 });
    removeAuthCookie(response);
    return response;
  }
}
 
