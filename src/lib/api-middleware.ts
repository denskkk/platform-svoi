/**
 * Middleware для перевірки прав доступу в API
 */

import { NextRequest, NextResponse } from 'next/server';
import { AUTH_FAILURE_KEYS, authenticateRequestToken } from '@/lib/session';
import { getApiT } from '@/i18n/server';
import type { Translator } from '@/i18n/translate';
import { hasPermission, getPermissionError, PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

/** Thrown by admin guards; handlers turn it into a localized 403 response. */
export class AdminForbiddenError extends Error {
  constructor() {
    super('Admin access required');
    this.name = 'AdminForbiddenError';
  }
}

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
export async function guardChatUser(userId: number, options: { write: boolean }, t: Translator): Promise<NextResponse | null> {
  const dbUser = await loadActiveUser(userId);
  if (!dbUser) {
    return NextResponse.json({ error: t('api.common.accountInactive') }, { status: 401 });
  }
  if (options.write && dbUser.accountType === 'viewer') {
    return NextResponse.json(
      { error: t('api.chat.viewerCannotWrite') },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Перевірити що користувач авторизований
 */
export async function requireAuth(request: NextRequest): Promise<{ user: any; error?: NextResponse }> {
  const t = getApiT(request);
  try {
    const auth = await authenticateRequestToken(request);
    if (!auth.ok) {
      const message = auth.reason === 'missing' ? t('api.common.authRequired')
        : auth.reason === 'invalid' ? t('api.common.invalidToken')
        : t(AUTH_FAILURE_KEYS.ended);
      return { user: null, error: NextResponse.json({ error: message }, { status: 401 }) };
    }
    const decoded = auth.payload;

    // Користувач мусить існувати й бути активним; тип акаунту беремо з БД (токен може бути застарілим)
    const dbUser = await loadActiveUser(decoded.userId);
    if (!dbUser) {
      return {
        user: null,
        error: NextResponse.json(
          { error: t('api.common.accountInactive') },
          { status: 401 }
        )
      };
    }

    return { user: { ...decoded, accountType: dbUser.accountType, role: dbUser.role } };
  } catch (error) {
    console.error('[auth] Authentication lookup failed');
    return {
      user: null,
      error: NextResponse.json(
        { error: t('api.common.authError') },
        { status: 500 }
      )
    };
  }
}

/**
 * Перевірити що користувач має право на дію
 */
export function requirePermission(
  accountType: string | null | undefined,
  permission: keyof typeof PERMISSIONS,
  t: Translator
): NextResponse | null {
  if (!hasPermission(accountType as any, permission)) {
    return NextResponse.json(
      { 
        error: getPermissionError(permission, t),
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

  const permissionError = requirePermission(user.accountType, permission, getApiT(request));
  if (permissionError) {
    return { user, error: permissionError };
  }

  return { user };
}
