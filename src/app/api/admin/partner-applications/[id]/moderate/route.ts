/**
 * POST /api/admin/partner-applications/:id/moderate { action: 'approve' | 'reject', reason? }
 * rewardPercent — орієнтовна пропозиція (0–50), зберігається як попередня, не як гарантія.
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
    if (!adminId || !(await hasAdminPermission(adminId, 'partners.review'))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });

    const id = parseId(idParam);
    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
    if (action !== 'approve' && action !== 'reject') return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    if (action === 'reject' && !reason) return NextResponse.json({ error: t('api.listings.reasonRequired') }, { status: 400 });

    const row = id ? await prisma.partnerApplication.findUnique({ where: { id }, select: { userId: true } }) : null;
    if (!id || !row) return NextResponse.json({ error: t('api.partnerApplications.notFound') }, { status: 404 });

    const approve = action === 'approve';
    const updated = await prisma.partnerApplication.updateMany({
      where: { id, status: 'pending' },
      data: approve
        ? { status: 'approved', rejectReason: null, moderatedAt: new Date(), moderatedById: adminId }
        : { status: 'rejected', rejectReason: reason, moderatedAt: new Date(), moderatedById: adminId },
    });
    if (updated.count === 0) return NextResponse.json({ error: t('api.listings.alreadyModerated') }, { status: 409 });

    await logAudit({
      actorId: adminId,
      action: approve ? 'partner_application.approve' : 'partner_application.reject',
      entityType: 'partner_application',
      entityId: id,
      details: approve ? undefined : { reason },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: row.userId,
          type: approve ? 'partner_approved' : 'partner_rejected',
          title: approve ? 'Заявку на партнерство схвалено' : 'Заявку на партнерство відхилено', // i18n-ignore
          message: approve ? '' : reason,
          relatedEntityType: 'partner_application',
          relatedEntityId: id,
        },
      });
    } catch (e) {
      console.error('Partner application notification error:', e);
    }

    return NextResponse.json({ success: true, status: approve ? 'approved' : 'rejected' });
  } catch (error) {
    console.error('Moderate partner application error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, (req) => handler(req, params.id));
}
