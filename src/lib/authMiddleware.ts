/**
 * Middleware для автентифікації з httpOnly cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAuthCookie } from '@/lib/cookies';

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
  // Спочатку шукаємо токен в httpOnly cookie (безпечніше)
  let token = getAuthCookie(request);

  // Якщо немає в cookie, шукаємо в Authorization header (для зворотної сумісності)
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return NextResponse.json(
      { error: 'Необхідна автентифікація' },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'Невалідний або прострочений токен' },
      { status: 401 }
    );
  }

  // Додаємо дані користувача до request
  const authenticatedReq = request as AuthenticatedRequest;
  authenticatedReq.user = payload;

  return handler(authenticatedReq);
}

/**
 * Опціональна автентифікація - не викидає помилку, якщо токен відсутній
 */
export async function withOptionalAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  let token = getAuthCookie(request);

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const authenticatedReq = request as AuthenticatedRequest;
      authenticatedReq.user = payload;
      return handler(authenticatedReq);
    }
  }

  // Продовжуємо без автентифікації
  return handler(request as AuthenticatedRequest);
}
