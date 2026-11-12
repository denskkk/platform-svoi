/**
 * Керування ролями персоналу — лише повний адміністратор (User.isAdmin).
 * GET  /api/admin/roles                       — список працівників із ролями
 * POST /api/admin/roles { email, role|null }  — призначити роль (або зняти, якщо role = null)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { ADMIN_ROLES, getAdminAccess } from '@/lib/adminAccess';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

async function getHandler(request: NextRequest) {
  const t = getApiT(request);
  try {
    const access = await getAdminAccess(Number((request as any).user?.userId));
    if (!access.isAdmin) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });

    const rows = await prisma.adminRole.findMany({
      orderBy: { id: 'desc' },
      take: 200,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    return NextResponse.json({
      roles: ADMIN_ROLES,
      staff: rows.map((r) => ({ userId: r.userId, role: r.role, name: `${r.user.firstName} ${r.user.lastName}`.trim(), email: r.user.email })),
    });
  } catch (error) {
    console.error('List admin roles error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

async function postHandler(request: NextRequest) {
  const t = getApiT(request);
  try {
    const adminId = Number((request as any).user?.userId);
    const access = await getAdminAccess(adminId);
    if (!access.isAdmin) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = body?.role === null ? null : body?.role;
    if (!email || (role !== null && !(ADMIN_ROLES as readonly string[]).includes(role))) {
      return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    }

    const target = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, isAdmin: true } });
    if (!target) return NextResponse.json({ error: t('api.common.userNotFound') }, { status: 404 });
    if (target.isAdmin) return NextResponse.json({ error: t('api.adminRoles.alreadyAdmin') }, { status: 400 });

    if (role === null) {
      await prisma.adminRole.deleteMany({ where: { userId: target.id } });
    } else {
      await prisma.adminRole.upsert({
        where: { userId: target.id },
        create: { userId: target.id, role, grantedById: adminId },
        update: { role, grantedById: adminId },
      });
    }
    await logAudit({ actorId: adminId, action: role === null ? 'admin_role.revoke' : 'admin_role.grant', entityType: 'user', entityId: target.id, details: { role } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set admin role error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, getHandler);
}
export async function POST(request: NextRequest) {
  return withAuth(request, postHandler);
}
