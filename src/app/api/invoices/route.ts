/**
 * GET  /api/invoices?role=received|issued&cursor= — мої рахунки
 * POST /api/invoices { payerId, amount, currency, description, dueAt? } — виставити рахунок
 * Система лише веде облік: оплата відбувається поза нею, статус «сплачено» підтверджує той, хто виставив.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { isBlockedBetween } from '@/lib/blocks';
import { logAudit } from '@/lib/audit';
import { parseId } from '@/lib/feed';
import { serializeInvoice, INVOICE_CURRENCIES, INVOICE_LIMITS } from '@/lib/invoices';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const userId = Number(user.userId);
    const p = new URL(request.url).searchParams;
    const issued = p.get('role') === 'issued';
    const cursor = parseId(p.get('cursor'));
    const where: any = issued ? { issuerId: userId } : { payerId: userId };
    if (cursor) where.id = { lt: cursor };
    const rows = await prisma.invoice.findMany({
      where, orderBy: { id: 'desc' }, take: INVOICE_LIMITS.pageSize + 1,
      include: {
        issuer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, businessInfo: { select: { companyName: true } } } },
        payer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    const hasMore = rows.length > INVOICE_LIMITS.pageSize;
    const page = hasMore ? rows.slice(0, INVOICE_LIMITS.pageSize) : rows;
    return NextResponse.json({ invoices: page.map((r: any) => serializeInvoice(r, userId)), nextCursor: hasMore ? page[page.length - 1].id : null });
  } catch (e) {
    console.error('[invoices GET]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const issuerId = Number(user.userId);
    if (user.accountType === 'viewer') return NextResponse.json({ error: t('api.chat.viewerCannotWrite') }, { status: 403 });
    if (!checkRateLimit(`invoice:create:${issuerId}`, { interval: 60 * 60 * 1000, maxRequests: 30 }).allowed) {
      return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });
    }
    const body = await request.json().catch(() => ({}));
    const payerId = Number(body?.payerId);
    const amount = Math.round(Number(body?.amount) * 100) / 100;
    const currency = String(body?.currency || 'UAH');
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const dueAt = body?.dueAt ? new Date(body.dueAt) : null;
    if (!Number.isInteger(payerId) || payerId <= 0 || payerId === issuerId || !Number.isFinite(amount) || amount <= 0 || amount > INVOICE_LIMITS.maxAmount
      || !(INVOICE_CURRENCIES as readonly string[]).includes(currency) || description.length < 3 || description.length > 500 || (dueAt && Number.isNaN(dueAt.getTime()))) {
      return NextResponse.json({ error: t('api.invoices.invalid') }, { status: 400 });
    }
    const payer = await prisma.user.findUnique({ where: { id: payerId }, select: { id: true, isActive: true } });
    if (!payer?.isActive) return NextResponse.json({ error: t('api.common.userNotFound') }, { status: 404 });
    if (await isBlockedBetween(issuerId, payerId)) return NextResponse.json({ error: t('api.feed.blocked') }, { status: 403 });

    const created = await prisma.invoice.create({ data: { issuerId, payerId, amount, currency, description, dueAt } });
    await logAudit({ actorId: issuerId, action: 'invoice.create', entityType: 'invoice', entityId: created.id, details: { payerId, amount, currency } });
    try {
      await prisma.notification.create({ data: { userId: payerId, type: 'invoice_new', title: 'Вам виставлено рахунок', message: `${amount} ${currency}`, relatedUserId: issuerId, relatedEntityType: 'invoice', relatedEntityId: created.id } }); // i18n-ignore
    } catch { /* сповіщення необов'язкове */ }
    return NextResponse.json({ success: true, id: created.id }, { status: 201 });
  } catch (e) {
    console.error('[invoices POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
