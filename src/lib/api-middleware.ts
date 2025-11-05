/**
 * Middleware для перевірки прав доступу в API
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { hasPermission, getPermissionError, PERMISSIONS } from '@/lib/permissions';

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

  return { user };
}
