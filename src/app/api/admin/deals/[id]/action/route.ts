/**
 * POST /api/admin/deals/:id/action { action: 'accrue' | 'payout' | 'reject' | 'restore', note? }
 * accrue: confirmed → accrued; payout: accrued → paid_out (виплата відмічається вручну після договору);
 * reject: будь-який крім paid_out → rejected; restore: disputed → попередній статус.
 * Кожен перехід атомарний і пишеться в журнал аудиту.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminPermission } from '@/lib/adminAccess';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { logAudit } from '@/lib/audit';
import { parseId } from '@/lib/feed';
import { notifyDeal } from '@/lib/deals';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest, idParam: string) {
  const t = getApiT(request);
  try {
    const adminId = Number((request as any).user?.userId);
    if (!adminId || !(await hasAdminPermission(adminId, 'deals.manage'))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });
    const id = parseId(idParam);
    const deal = id ? await prisma.deal.findUnique({ where: { id } }) : null;
    if (!id || !deal) return NextResponse.json({ error: t('api.deals.notFound') }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : '';
    const now = new Date();
    let res: any = null;
    let status = '';

    if (action === 'accrue') {
      res = await prisma.deal.updateMany({ where: { id, status: 'confirmed', commission: { not: null } }, data: { status: 'accrued', accruedAt: now } });
      status = 'accrued';
      if (res.count) await notifyDeal(deal.referrerId, 'deal_accrued', id);
    } else if (action === 'payout') {
      res = await prisma.deal.updateMany({ where: { id, status: 'accrued' }, data: { status: 'paid_out', paidOutAt: now } });
      status = 'paid_out';
      if (res.count) await notifyDeal(deal.referrerId, 'deal_paid_out', id);
    } else if (action === 'reject') {
      res = await prisma.deal.updateMany({ where: { id, status: { not: 'paid_out' } }, data: { status: 'rejected', disputeReason: note || deal.disputeReason } });
      status = 'rejected';
      if (res.count) { await notifyDeal(deal.referrerId, 'deal_rejected', id); await notifyDeal(deal.businessUserId, 'deal_rejected', id); }
    } else if (action === 'restore') {
      const back = deal.statusBeforeDispute || 'customer_applied';
      res = await prisma.deal.updateMany({ where: { id, status: 'disputed' }, data: { status: back, statusBeforeDispute: null, disputeReason: null } });
      status = back;
    } else {
      return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    }

    if (!res || res.count === 0) return NextResponse.json({ error: t('api.deals.badState') }, { status: 409 });
    await logAudit({ actorId: adminId, action: `deal.admin.${action}`, entityType: 'deal', entityId: id, details: { from: deal.status, to: status, note, amount: deal.amount === null ? null : Number(deal.amount), commission: deal.commission === null ? null : Number(deal.commission) } });
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Admin deal action error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, (req) => handler(req, params.id));
}
