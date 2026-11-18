/**
 * POST /api/invoices/:id { action }
 *  - payer_marked: платник відмічає «я сплатив» (лише платник)
 *  - paid: той, хто виставив, підтверджує отримання
 *  - cancel: той, хто виставив, скасовує (поки не сплачено)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { logAudit } from '@/lib/audit';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const userId = Number(user.userId);
    const id = parseId(params.id);
    const action = String((await request.json().catch(() => ({})))?.action || '');
    const inv = id ? await prisma.invoice.findUnique({ where: { id } }) : null;
    if (!inv || (inv.issuerId !== userId && inv.payerId !== userId)) return NextResponse.json({ error: t('api.invoices.notFound') }, { status: 404 });

    let next: { status: string; paidAt?: Date } | null = null;
    if (action === 'payer_marked' && inv.payerId === userId && inv.status === 'issued') next = { status: 'payer_marked' };
    else if (action === 'paid' && inv.issuerId === userId && (inv.status === 'issued' || inv.status === 'payer_marked')) next = { status: 'paid', paidAt: new Date() };
    else if (action === 'cancel' && inv.issuerId === userId && (inv.status === 'issued' || inv.status === 'payer_marked')) next = { status: 'cancelled' };
    if (!next) return NextResponse.json({ error: t('api.invoices.badTransition') }, { status: 400 });

    await prisma.invoice.update({ where: { id: inv.id }, data: next });
    await logAudit({ actorId: userId, action: `invoice.${action}`, entityType: 'invoice', entityId: inv.id });
    const other = userId === inv.issuerId ? inv.payerId : inv.issuerId;
    try {
      await prisma.notification.create({ data: { userId: other, type: `invoice_${next.status}`, title: 'Статус рахунку змінено', relatedUserId: userId, relatedEntityType: 'invoice', relatedEntityId: inv.id } }); // i18n-ignore
    } catch { /* необов'язково */ }
    return NextResponse.json({ success: true, status: next.status });
  } catch (e) {
    console.error('[invoices action]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
