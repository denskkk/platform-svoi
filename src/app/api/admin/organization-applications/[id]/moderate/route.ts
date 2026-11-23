/**
 * POST /api/admin/organization-applications/:id/moderate { action: 'approve' | 'reject', reason? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminPermission } from '@/lib/adminAccess';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { logAudit } from '@/lib/audit';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest, idParam: string) {
  const t = getApiT(request);
  try {
    const adminId = Number((request as any).user?.userId);
    if (!adminId || !(await hasAdminPermission(adminId, 'business.review'))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });

    const id = parseId(idParam);
    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
    if (action !== 'approve' && action !== 'reject') return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    if (action === 'reject' && !reason) return NextResponse.json({ error: t('api.listings.reasonRequired') }, { status: 400 });

    const row = id ? await prisma.organizationApplication.findUnique({ where: { id }, select: { userId: true } }) : null;
    if (!id || !row) return NextResponse.json({ error: t('api.organizationApplications.notFound') }, { status: 404 });

    const approve = action === 'approve';
    const updated = await prisma.organizationApplication.updateMany({
      where: { id, status: 'pending' },
      data: approve
        ? { status: 'approved', rejectReason: null, moderatedAt: new Date(), moderatedById: adminId }
        : { status: 'rejected', rejectReason: reason, moderatedAt: new Date(), moderatedById: adminId },
    });
    if (updated.count === 0) return NextResponse.json({ error: t('api.listings.alreadyModerated') }, { status: 409 });

    await logAudit({
      actorId: adminId,
      action: approve ? 'organization_application.approve' : 'organization_application.reject',
      entityType: 'organization_application',
      entityId: id,
      details: approve ? {} : { reason },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: row.userId,
          type: approve ? 'organization_approved' : 'organization_rejected',
          title: approve ? 'Заявку організації схвалено' : 'Заявку організації відхилено', // i18n-ignore
          message: approve ? '' : reason,
          relatedEntityType: 'organization_application',
          relatedEntityId: id,
        },
      });
    } catch (e) {
      console.error('Organization application notification error:', e);
    }

    return NextResponse.json({ success: true, status: approve ? 'approved' : 'rejected' });
  } catch (error) {
    console.error('Moderate organization application error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, (req) => handler(req, params.id));
}
