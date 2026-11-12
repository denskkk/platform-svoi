/**
 * Права персоналу. Повний адміністратор (User.isAdmin) має всі права.
 * Ролі з таблиці admin_roles відкривають лише свої розділи. Якщо таблиці ще немає — діє тільки isAdmin.
 */

import { prisma } from '@/lib/prisma';

export const ADMIN_ROLES = ['moderator', 'business_manager', 'support'] as const;
export type AdminRoleName = (typeof ADMIN_ROLES)[number];

export type AdminPermission =
  | 'listings.moderate'
  | 'business.review'
  | 'partners.review'
  | 'content.edit'
  | 'reports.handle';

export const ALL_PERMISSIONS: AdminPermission[] = ['listings.moderate', 'business.review', 'partners.review', 'content.edit', 'reports.handle'];

export const ROLE_PERMISSIONS: Record<AdminRoleName, AdminPermission[]> = {
  moderator: ['listings.moderate', 'reports.handle'],
  business_manager: ['business.review', 'partners.review', 'content.edit'],
  support: ['reports.handle'],
};

export interface AdminAccess {
  isAdmin: boolean;
  role: AdminRoleName | null;
  permissions: AdminPermission[];
}

export async function getAdminAccess(userId: number): Promise<AdminAccess> {
  if (!Number.isInteger(userId) || userId <= 0) return { isAdmin: false, role: null, permissions: [] };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true, isActive: true } });
  if (!user?.isActive) return { isAdmin: false, role: null, permissions: [] };
  if (user.isAdmin) return { isAdmin: true, role: null, permissions: ALL_PERMISSIONS };

  try {
    const row = await prisma.adminRole.findUnique({ where: { userId }, select: { role: true } });
    if (row && (ADMIN_ROLES as readonly string[]).includes(row.role)) {
      const role = row.role as AdminRoleName;
      return { isAdmin: false, role, permissions: ROLE_PERMISSIONS[role] };
    }
  } catch {
    // таблиця ще не створена — права лише в повних адміністраторів
  }
  return { isAdmin: false, role: null, permissions: [] };
}

export async function hasAdminPermission(userId: number, permission: AdminPermission): Promise<boolean> {
  const access = await getAdminAccess(userId);
  return access.permissions.includes(permission);
}
