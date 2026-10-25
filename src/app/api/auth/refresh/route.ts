/**
 * POST /api/auth/refresh
 * Видає нову пару токенів для активної сесії та продовжує її ще на 30 днів.
 *
 * Токени прив'язані до сесії (sid), тому паралельні виклики, повторні спроби після обриву
 * мережі і кілька вкладок безпечні: кожен отримує чинні токени, ніхто не вилогінюється.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken, isSessionId, verifyRefreshToken, verifyToken } from '@/lib/auth';
import { getRefreshCookie, setAuthCookie, setRefreshCookie } from '@/lib/cookies';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import {
  buildTokens,
  extractRequestTokens,
  findActiveSession,
  sessionExpiry,
} from '@/lib/session';

export const dynamic = 'force-dynamic';

function allowedHosts(request: NextRequest): Set<string> {
  const hosts = new Set<string>();
  const add = (value: string | null | undefined) => {
    if (value) hosts.add(value.trim().toLowerCase());
  };

  add(request.headers.get('x-forwarded-host')?.split(',')[0]);
  add(request.headers.get('host'));
  add(new URL(request.url).host);

  const configured = [process.env.NEXT_PUBLIC_SITE_URL, ...(process.env.APP_ALLOWED_ORIGINS || '').split(',')];
  for (const entry of configured) {
    if (!entry?.trim()) continue;
    try {
      const host = new URL(entry.trim()).host.toLowerCase();
      hosts.add(host);
      hosts.add(host.startsWith('www.') ? host.slice(4) : `www.${host}`);
    } catch {
      // некоректне значення в env ігноруємо
    }
  }
  return hosts;
}

/**
 * Порівнюємо хост, а не повний origin: за nginx протокол у request.url може бути http,
 * хоча браузер працює по https — раніше через це /refresh повертав 403.
 */
function validOrigin(request: NextRequest): boolean {
  if (request.headers.get('sec-fetch-site') === 'same-origin') return true;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return allowedHosts(request).has(new URL(origin).host.toLowerCase());
  } catch {
    return false;
  }
}

function sessionEnded() {
  return NextResponse.json({ error: 'Сесія завершена' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  if (!validOrigin(request)) {
    return NextResponse.json({ error: 'Недозволене джерело запиту' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`refresh:${ip}`, {
    interval: 5 * 60 * 1000,
    maxRequests: 120,
  });

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Забагато запитів. Спробуйте пізніше.' },
      { status: 429, headers: { 'Retry-After': retryAfter.toString() } },
    );
  }

  try {
    const now = new Date();
    let session: { id: string; userId: number } | null = null;

    const refreshToken = getRefreshCookie(request);
    const refreshPayload = refreshToken ? verifyRefreshToken(refreshToken) : null;
    if (refreshToken && refreshPayload && Number.isSafeInteger(refreshPayload.userId) && refreshPayload.userId > 0) {
      session = await prisma.session.findFirst({
        where: {
          ...(isSessionId(refreshPayload.sid)
            ? { id: refreshPayload.sid }
            // Старі refresh-токени (до введення sid) шукаємо за хешем
            : { refreshTokenHash: hashToken(refreshToken) }),
          userId: refreshPayload.userId,
          isActive: true,
          expiresAt: { gt: now },
        },
        select: { id: true, userId: true },
      });
    }

    // Запасний варіант: refresh-cookie втрачено, але access-токен ще чинний
    if (!session) {
      for (const token of extractRequestTokens(request)) {
        const payload = verifyToken(token);
        if (!payload || !Number.isSafeInteger(payload.userId) || payload.userId <= 0) continue;
        const found = await findActiveSession(payload, token);
        if (found) {
          session = { id: found.id, userId: payload.userId };
          break;
        }
      }
    }

    if (!session) return sessionEnded();

    const activeUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, role: true, accountType: true, isActive: true },
    });
    if (!activeUser?.isActive) return sessionEnded();

    const { token, refreshToken: nextRefreshToken } = buildTokens(activeUser, session.id);

    const updated = await prisma.session.updateMany({
      where: { id: session.id, isActive: true },
      data: {
        tokenHash: hashToken(token),
        refreshTokenHash: hashToken(nextRefreshToken),
        expiresAt: sessionExpiry(now),
        lastActivity: now,
      },
    });
    // Сесію відкликали (logout) між перевіркою та оновленням
    if (updated.count !== 1) return sessionEnded();

    const response = NextResponse.json({ success: true, token });
    response.headers.set('Cache-Control', 'no-store');
    setAuthCookie(response, token);
    setRefreshCookie(response, nextRefreshToken);
    return response;
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: 'Сервіс тимчасово недоступний' }, { status: 503 });
  }
}
