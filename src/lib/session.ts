/**
 * Сесії користувачів.
 *
 * Сесія в БД — єдине джерело істини: access і refresh токени несуть її id (`sid`).
 * Тому оновлення токенів не робить попередні токени недійсними, а паралельні запити
 * чи втрачена відповідь /refresh не вилогінюють користувача. Сесію завершує тільки
 * logout, деактивація акаунту або закінчення строку (30 днів з останнього оновлення).
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  JWTPayload,
  generateRefreshToken,
  generateToken,
  hashToken,
  isSessionId,
  verifyToken,
} from '@/lib/auth';
import { getAuthCookie } from '@/lib/cookies';
import { getClientIp } from '@/lib/rateLimit';

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: number;
  email: string;
  role: string;
  accountType?: string | null;
}

export function sessionExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + SESSION_TTL_MS);
}

export function buildTokens(user: SessionUser, sid: string) {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    accountType: user.accountType ?? undefined,
    sid,
  };
  return { token: generateToken(payload), refreshToken: generateRefreshToken(payload) };
}

/** Створює сесію та пару токенів для щойно автентифікованого користувача. */
export async function createSession(user: SessionUser, request: Request) {
  const sid = randomUUID();
  const { token, refreshToken } = buildTokens(user, sid);

  await prisma.session.create({
    data: {
      id: sid,
      userId: user.id,
      tokenHash: hashToken(token),
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: sessionExpiry(),
      ipAddress: getClientIp(request),
      userAgent: (request.headers.get('user-agent') || 'unknown').slice(0, 512),
    },
  });

  return { token, refreshToken, sid };
}

/** Активна сесія, до якої належить токен (нові токени — за sid, старі — за хешем токена). */
export async function findActiveSession(payload: JWTPayload, token: string): Promise<{ id: string } | null> {
  const where = isSessionId(payload.sid)
    ? { id: payload.sid }
    : { tokenHash: hashToken(token) };

  return prisma.session.findFirst({
    where: {
      ...where,
      userId: payload.userId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
}

/** Токени запиту: спочатку cookie, потім Authorization (якщо cookie застаріла — є шанс на header). */
export function extractRequestTokens(request: Request): string[] {
  const tokens: string[] = [];
  const cookieToken = getAuthCookie(request);
  if (cookieToken) tokens.push(cookieToken);

  const header = request.headers.get('authorization');
  const match = header?.match(/^Bearer\s+(.+)$/i);
  const headerToken = match?.[1]?.trim();
  if (headerToken && !tokens.includes(headerToken)) tokens.push(headerToken);

  return tokens;
}

export type AuthFailure = 'missing' | 'invalid' | 'ended';

export type TokenAuthResult =
  | { ok: true; payload: JWTPayload; token: string; sessionId: string }
  | { ok: false; reason: AuthFailure };

/** Знаходить перший токен запиту, що має чинний підпис і активну сесію. */
export async function authenticateRequestToken(request: Request): Promise<TokenAuthResult> {
  const tokens = extractRequestTokens(request);
  if (tokens.length === 0) return { ok: false, reason: 'missing' };

  let reason: AuthFailure = 'invalid';
  for (const token of tokens) {
    const payload = verifyToken(token);
    if (!payload || !Number.isSafeInteger(payload.userId) || payload.userId <= 0) continue;

    const session = await findActiveSession(payload, token);
    if (session) return { ok: true, payload, token, sessionId: session.id };
    reason = 'ended';
  }
  return { ok: false, reason };
}

export const AUTH_FAILURE_MESSAGES: Record<AuthFailure, string> = {
  missing: 'Необхідна автентифікація',
  invalid: 'Невалідний або прострочений токен',
  ended: 'Сесія завершена. Увійдіть знову.',
};
