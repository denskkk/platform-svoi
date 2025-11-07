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

    return { user: decoded };
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

  // Додатково: перевірка активної підписки для платних функцій
  const paidPermissions: Array<keyof typeof PERMISSIONS> = [
    'CREATE_REQUEST','VIEW_REQUESTS','SEND_MESSAGE','VIEW_MESSAGES',
    'CREATE_SERVICE','EDIT_SERVICE','DELETE_SERVICE','RESPOND_TO_REQUEST',
    'VIEW_BUSINESS_PROFILE','EDIT_BUSINESS_PROFILE','SEARCH_PARTNERS','SEARCH_INVESTORS','SEARCH_CUSTOMERS',
    'AUTO_PROPOSALS','UCM_ANALYSIS','PRIORITY_SEARCH','ADVANCED_ANALYTICS',
  ];

  if (paidPermissions.includes(permission)) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { accountType: true, subscriptionActive: true, subscriptionExpiresAt: true }
      });
      const now = new Date();
      const isExpired = dbUser?.subscriptionExpiresAt ? new Date(dbUser.subscriptionExpiresAt) < now : false;
      const isActive = Boolean(dbUser?.subscriptionActive) && !isExpired;

      // Для базового акаунту платні функції не дозволені — вже відфільтровано вище по accountType
      // Для інших — потрібна активна підписка
      if (dbUser && dbUser.accountType !== 'basic' && !isActive) {
        return {
          user,
          error: NextResponse.json(
            {
              error: 'Потрібна активна підписка для використання цієї функції. Ваш пробний період завершено.',
              permission,
              accountType: dbUser.accountType,
              subscriptionActive: dbUser.subscriptionActive,
              subscriptionExpiresAt: dbUser.subscriptionExpiresAt,
            },
            { status: 403 }
          )
        };
      }
    } catch (e) {
      // У випадку збоїв перевірки — не блокуємо запит, але логуючи
      console.warn('[requireAuthWithPermission] Не вдалося перевірити підписку:', e);
    }
  }

  return { user };
}
