/**
 * POST /api/deals/:id/action { action: 'confirm' | 'reject' | 'dispute', amount?, reason? }
 * confirm/reject — лише компанія-учасник угоди; dispute — компанія або реферер.
 * Сума фіксується один раз (потім не змінюється), винагорода рахується за відсотком, збереженим в угоді.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { logAudit } from '@/lib/audit';
import { parseId } from '@/lib/feed';
import { calcCommission, DISPUTABLE, MAX_DEAL_AMOUNT, notifyDeal, OPEN_STATUSES } from '@/lib/deals';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);
    const id = parseId(params.id);
    const deal = id ? await prisma.deal.findUnique({ where: { id } }) : null;
    if (!id || !deal || (deal.businessUserId !== userId && deal.referrerId !== userId)) {
      return NextResponse.json({ error: t('api.deals.notFound') }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const isBusiness = deal.businessUserId === userId;

    if (action === 'confirm') {
      if (!isBusiness) return NextResponse.json({ error: t('api.feed.forbidden') }, { status: 403 });
      const amount = Math.round(Number(body?.amount) * 100) / 100;
      if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_DEAL_AMOUNT) return NextResponse.json({ error: t('api.deals.amountInvalid') }, { status: 400 });
      const commission = calcCommission(amount, Number(deal.percent));
      const res = await prisma.deal.updateMany({
        where: { id, status: { in: OPEN_STATUSES }, businessUserId: userId },
        data: { status: 'confirmed', amount, commission, confirmedAt: new Date() },
      });
      if (res.count === 0) return NextResponse.json({ error: t('api.deals.badState') }, { status: 409 });
      await logAudit({ actorId: userId, action: 'deal.confirm', entityType: 'deal', entityId: id, details: { amount, percent: Number(deal.percent), commission } });
      await notifyDeal(deal.referrerId, 'deal_confirmed', id);
      return NextResponse.json({ success: true, status: 'confirmed', commission });
    }

    if (action === 'reject') {
      if (!isBusiness) return NextResponse.json({ error: t('api.feed.forbidden') }, { status: 403 });
      const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
      const res = await prisma.deal.updateMany({
        where: { id, status: { in: OPEN_STATUSES }, businessUserId: userId },
        data: { status: 'rejected', disputeReason: reason || null },
      });
      if (res.count === 0) return NextResponse.json({ error: t('api.deals.badState') }, { status: 409 });
      await logAudit({ actorId: userId, action: 'deal.reject', entityType: 'deal', entityId: id, details: { reason } });
      await notifyDeal(deal.referrerId, 'deal_rejected', id);
      return NextResponse.json({ success: true, status: 'rejected' });
    }

    if (action === 'dispute') {
      const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
      if (reason.length < 5) return NextResponse.json({ error: t('api.deals.reasonRequired') }, { status: 400 });
      const res = await prisma.deal.updateMany({
        where: { id, status: { in: DISPUTABLE } },
        data: { status: 'disputed', statusBeforeDispute: deal.status, disputeReason: reason },
      });
      if (res.count === 0) return NextResponse.json({ error: t('api.deals.badState') }, { status: 409 });
      await logAudit({ actorId: userId, action: 'deal.dispute', entityType: 'deal', entityId: id, details: { reason, from: deal.status } });
      await notifyDeal(isBusiness ? deal.referrerId : deal.businessUserId, 'deal_disputed', id);
      return NextResponse.json({ success: true, status: 'disputed' });
    }

    return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
  } catch (error) {
    console.error('Deal action error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
