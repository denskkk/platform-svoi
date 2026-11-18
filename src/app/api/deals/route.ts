/**
 * GET  /api/deals?role=referrer|business|customer&status=&cursor=<id> — мої угоди
 * POST /api/deals { businessId, mode: 'lead' | 'link', referrerId?, customerName?, customerContact?, note? }
 *   lead — я (реферер) передаю клієнта компанії; link — я клієнт і прийшов за рекомендацією referrerId.
 * Працює лише для компаній з активною реферальною програмою; відсоток фіксується в угоді на момент створення.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { isBlockedBetween } from '@/lib/blocks';
import { parseId } from '@/lib/feed';
import { DEAL_STATUSES, notifyDeal, serializeDeal } from '@/lib/deals';

export const dynamic = 'force-dynamic';

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const p = new URL(request.url).searchParams;
    const role = p.get('role') === 'business' ? 'business' : p.get('role') === 'customer' ? 'customer' : 'referrer';
    const status = p.get('status') || '';
    const cursor = parseId(p.get('cursor'));
    const where: any = {
      ...(role === 'business' ? { businessUserId: userId } : role === 'customer' ? { customerId: userId } : { referrerId: userId }),
      ...((DEAL_STATUSES as readonly string[]).includes(status) ? { status } : {}),
      ...(cursor ? { id: { lt: cursor } } : {}),
    };
    const rows = await prisma.deal.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 21,
      include: {
        business: { select: { id: true, businessInfo: { select: { companyName: true } }, firstName: true, lastName: true } },
        referrer: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    const hasMore = rows.length > 20;
    const page = hasMore ? rows.slice(0, 20) : rows;
    const name = (u: any) => (u ? `${u.firstName} ${u.lastName}`.trim() : null);
    return NextResponse.json({
      deals: page.map((d: any) => ({
        ...serializeDeal(d),
        business: { id: d.business.id, name: d.business.businessInfo?.companyName || name(d.business) },
        referrer: { id: d.referrer.id, name: name(d.referrer) },
        customer: d.customer ? { id: d.customer.id, name: name(d.customer) } : null,
      })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error('Deals list error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    if (!checkRateLimit(`deal:create:${userId}`, { interval: 24 * 60 * 60 * 1000, maxRequests: 30 }).allowed) {
      return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });
    }
    const body = await request.json().catch(() => ({}));
    const businessId = parseId(body?.businessId);
    const mode = body?.mode === 'link' ? 'link' : 'lead';
    if (!businessId) return NextResponse.json({ error: t('api.deals.companyNotFound') }, { status: 404 });
    if (businessId === userId) return NextResponse.json({ error: t('api.deals.selfDeal') }, { status: 400 });

    const program = await prisma.referralProgram.findFirst({
      where: { businessUserId: businessId, status: 'active', business: { isActive: true } },
      select: { percent: true },
    });
    if (!program) return NextResponse.json({ error: t('api.deals.noProgram') }, { status: 400 });
    if (await isBlockedBetween(userId, businessId)) return NextResponse.json({ error: t('api.feed.blocked') }, { status: 403 });

    let data: any;
    if (mode === 'link') {
      const referrerId = parseId(body?.referrerId);
      if (!referrerId || referrerId === userId || referrerId === businessId) return NextResponse.json({ error: t('api.deals.invalidReferrer') }, { status: 400 });
      const referrer = await prisma.user.findFirst({ where: { id: referrerId, isActive: true }, select: { id: true } });
      if (!referrer || (await isBlockedBetween(userId, referrerId))) return NextResponse.json({ error: t('api.deals.invalidReferrer') }, { status: 400 });
      data = { businessUserId: businessId, referrerId, customerId: userId, source: 'link', status: 'customer_applied', percent: program.percent };
    } else {
      const customerName = str(body?.customerName, 120);
      const customerContact = str(body?.customerContact, 100);
      if (!customerName || customerContact.length < 5) return NextResponse.json({ error: t('api.deals.customerRequired') }, { status: 400 });
      // Дублювання клієнтів: той самий контакт у компанії, поки угода не відхилена
      const dup = await prisma.deal.findFirst({
        where: { businessUserId: businessId, status: { not: 'rejected' }, customerContact: { equals: customerContact, mode: 'insensitive' } },
        select: { id: true },
      });
      if (dup) return NextResponse.json({ error: t('api.deals.duplicate') }, { status: 409 });
      data = { businessUserId: businessId, referrerId: userId, customerName, customerContact, note: str(body?.note, 300) || null, source: 'lead', status: 'lead_created', percent: program.percent };
    }

    let deal;
    try {
      deal = await prisma.deal.create({ data });
    } catch (e: any) {
      if (e?.code === 'P2002') return NextResponse.json({ error: t('api.deals.duplicate') }, { status: 409 });
      throw e;
    }
    await notifyDeal(businessId, 'deal_new', deal.id);
    return NextResponse.json({ deal: serializeDeal(deal) }, { status: 201 });
  } catch (error) {
    console.error('Create deal error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
