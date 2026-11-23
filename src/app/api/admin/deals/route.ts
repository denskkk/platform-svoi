/** GET /api/admin/deals?status=&cursor=<id> — угоди (потрібне право deals.manage) */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminPermission } from '@/lib/adminAccess';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';
import { DEAL_STATUSES, serializeDeal } from '@/lib/deals';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  const t = getApiT(request);
  try {
    const adminId = Number((request as any).user?.userId);
    if (!adminId || !(await hasAdminPermission(adminId, 'deals.manage'))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });
    const p = new URL(request.url).searchParams;
    const status = p.get('status') || '';
    const cursor = parseId(p.get('cursor'));
    const rows = await prisma.deal.findMany({
      where: { ...((DEAL_STATUSES as readonly string[]).includes(status) ? { status } : {}), ...(cursor ? { id: { lt: cursor } } : {}) },
      orderBy: { id: 'desc' },
      take: 21,
      include: {
        business: { select: { id: true, firstName: true, lastName: true, businessInfo: { select: { companyName: true } } } },
        referrer: { select: { id: true, firstName: true, lastName: true, email: true } },
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    const hasMore = rows.length > 20;
    const page = hasMore ? rows.slice(0, 20) : rows;
    const name = (u: any) => (u ? `${u.firstName} ${u.lastName}`.trim() : null);
    return NextResponse.json({
      deals: page.map((d: any) => ({
        ...serializeDeal(d),
        statusBeforeDispute: d.statusBeforeDispute,
        business: { id: d.business.id, name: d.business.businessInfo?.companyName || name(d.business) },
        referrer: { id: d.referrer.id, name: name(d.referrer), email: d.referrer.email },
        customer: d.customer ? { id: d.customer.id, name: name(d.customer) } : null,
      })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error('Admin deals error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler);
}
