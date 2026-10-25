/**
 * Middleware для автентифікації з httpOnly cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AUTH_FAILURE_MESSAGES, authenticateRequestToken } from '@/lib/session';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: number;
    email: string;
    role: string;
    accountType?: string;
  };
}

/**
 * Перевіряє JWT токен з cookie або header
 * Додає інформацію про користувача до request
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Спочатку httpOnly cookie, потім Authorization header (зворотна сумісність)
  const auth = await authenticateRequestToken(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: AUTH_FAILURE_MESSAGES[auth.reason] },
      { status: 401 }
    );
  }
  const { payload } = auth;

  // Додаємо дані користувача до request
  const dbUser = await prisma.user.findUnique({
    where: { id: Number(payload.userId) },
    select: { isActive: true, accountType: true, role: true }
  });
  if (!dbUser || !dbUser.isActive) {
    return NextResponse.json(
      { error: 'Акаунт не знайдено або деактивовано' },
      { status: 401 }
    );
  }

  const authenticatedReq = request as AuthenticatedRequest;
  authenticatedReq.user = { ...payload, accountType: dbUser.accountType, role: dbUser.role };

  return handler(authenticatedReq);
}

/**
 * Опціональна автентифікація - не викидає помилку, якщо токен відсутній
 */
export async function withOptionalAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await authenticateRequestToken(request);
  if (auth.ok) {
    const dbUser = await prisma.user.findUnique({
      where: { id: auth.payload.userId },
      select: { isActive: true, accountType: true, role: true },
    });

    if (dbUser?.isActive) {
      const authenticatedReq = request as AuthenticatedRequest;
      authenticatedReq.user = {
        ...auth.payload,
        accountType: dbUser.accountType,
        role: dbUser.role,
      };
      return handler(authenticatedReq);
    }
  }

  // Продовжуємо без автентифікації
  return handler(request as AuthenticatedRequest);
}
