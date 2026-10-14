/**
 * Middleware для перевірки прав доступу в API
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { hasPermission, getPermissionError, PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
    accountType: string;
  };
}

/**
 * Повертає актуальні дані користувача, якщо він існує та активний (інакше null)
 */
export async function loadActiveUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, isActive: true, accountType: true, role: true }
  });
  return user && user.isActive ? user : null;
}

/**
 * Перевірка користувача для чату: існує й активний; для запису (створення діалогу / відправка) — не «Глядач».
 * Повертає NextResponse з помилкою або null, якщо все гаразд.
 */
export async function guardChatUser(userId: number, options: { write: boolean }): Promise<NextResponse | null> {
  const dbUser = await loadActiveUser(userId);
  if (!dbUser) {
    return NextResponse.json({ error: 'Акаунт не знайдено або деактивовано' }, { status: 401 });
  }
  if (options.write && dbUser.accountType === 'viewer') {
    return NextResponse.json(
      { error: 'Глядачі не можуть писати у чаті. Перейдіть на звичайний профіль на сторінці свого профілю.' },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Перевірити що користувач авторизований
 */
export async function requireAuth(request: NextRequest): Promise<{ user: any; error?: NextResponse }> {
  try {
    // Спробувати отримати токен з cookie
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Необхідна авторизація' },
          { status: 401 }
        )
      };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Невалідний токен' },
          { status: 401 }
        )
      };
    }

    // Користувач мусить існувати й бути активним; тип акаунту беремо з БД (токен може бути застарілим)
    const dbUser = await loadActiveUser(decoded.userId);
    if (!dbUser) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Акаунт не знайдено або деактивовано' },
          { status: 401 }
        )
      };
    }

    return { user: { ...decoded, accountType: dbUser.accountType, role: dbUser.role } };
  } catch (error) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Помилка авторизації' },
        { status: 401 }
      )
    };
  }
}

/**
 * Перевірити що користувач має право на дію
 */
export function requirePermission(
  accountType: string | null | undefined,
  permission: keyof typeof PERMISSIONS
): NextResponse | null {
  if (!hasPermission(accountType as any, permission)) {
    return NextResponse.json(
      { 
        error: getPermissionError(permission),
        requiredPermission: permission,
        currentAccountType: accountType || 'none'
      },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Комбінована перевірка: авторизація + права доступу
 */
export async function requireAuthWithPermission(
  request: NextRequest,
  permission: keyof typeof PERMISSIONS
): Promise<{ user: any; error?: NextResponse }> {
  const { user, error } = await requireAuth(request);
  
  if (error) {
    return { user: null, error };
  }

  const permissionError = requirePermission(user.accountType, permission);
  if (permissionError) {
    return { user, error: permissionError };
  }

  return { user };
}
