/**
 * POST /api/admin/business-applications/:id/moderate { action: 'approve' | 'reject', reason?, rewardPercent? }
 * rewardPercent — орієнтовна пропозиція (0–50), зберігається як попередня, не як гарантія.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { logAudit } from '@/lib/audit';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest, idParam: string) {
  const t = getApiT(request);
  try {
    const adminId = Number((request as any).user?.userId);
    const me = adminId ? await prisma.user.findUnique({ where: { id: adminId }, select: { isAdmin: true } }) : null;
    if (!me?.isAdmin) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });

    const id = parseId(idParam);
    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
    if (action !== 'approve' && action !== 'reject') return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    if (action === 'reject' && !reason) return NextResponse.json({ error: t('api.listings.reasonRequired') }, { status: 400 });

    let percent: number | null = null;
    if (action === 'approve' && body?.rewardPercent !== undefined && body?.rewardPercent !== null && body?.rewardPercent !== '') {
      percent = Number(body.rewardPercent);
      if (!Number.isFinite(percent) || percent < 0 || percent > 50) {
        return NextResponse.json({ error: t('api.businessApplications.percentInvalid') }, { status: 400 });
      }
      percent = Math.round(percent * 100) / 100;
    }

    const row = id ? await prisma.businessApplication.findUnique({ where: { id }, select: { userId: true } }) : null;
    if (!id || !row) return NextResponse.json({ error: t('api.businessApplications.notFound') }, { status: 404 });

    const approve = action === 'approve';
    const updated = await prisma.businessApplication.updateMany({
      where: { id, status: 'pending' },
      data: approve
        ? { status: 'approved', rejectReason: null, proposedRewardPercent: percent, moderatedAt: new Date(), moderatedById: adminId }
        : { status: 'rejected', rejectReason: reason, proposedRewardPercent: null, moderatedAt: new Date(), moderatedById: adminId },
    });
    if (updated.count === 0) return NextResponse.json({ error: t('api.listings.alreadyModerated') }, { status: 409 });

    await logAudit({
      actorId: adminId,
      action: approve ? 'business_application.approve' : 'business_application.reject',
      entityType: 'business_application',
      entityId: id,
      details: approve ? { rewardPercent: percent } : { reason },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: row.userId,
          type: approve ? 'business_approved' : 'business_rejected',
          title: approve ? 'Заявку бізнесу схвалено' : 'Заявку бізнесу відхилено', // i18n-ignore
          message: approve ? '' : reason,
          relatedEntityType: 'business_application',
          relatedEntityId: id,
        },
      });
    } catch (e) {
      console.error('Business application notification error:', e);
    }

    return NextResponse.json({ success: true, status: approve ? 'approved' : 'rejected' });
  } catch (error) {
    console.error('Moderate business application error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, (req) => handler(req, params.id));
}
