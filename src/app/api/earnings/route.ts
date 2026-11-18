/** GET /api/earnings — «Мій заробіток»: підсумки за угодами, де я реферер. Лише підтверджені дані. */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const groups = await prisma.deal.groupBy({
      by: ['status'],
      where: { referrerId: userId },
      _count: { _all: true },
      _sum: { amount: true, commission: true },
    });
    const by: Record<string, { count: number; amount: number; commission: number }> = {};
    for (const g of groups) by[g.status] = { count: g._count._all, amount: Number(g._sum.amount || 0), commission: Number(g._sum.commission || 0) };
    const c = (s: string) => by[s]?.count || 0;
    const sumOf = (field: 'amount' | 'commission', statuses: string[]) => Math.round(statuses.reduce((a, s) => a + (by[s]?.[field] || 0), 0) * 100) / 100;

    const confirmedStatuses = ['confirmed', 'accrued', 'paid_out'];
    const customers = await prisma.deal.count({ where: { referrerId: userId, status: { notIn: ['rejected'] } } });

    return NextResponse.json({
      customers,
      active: c('lead_created') + c('customer_applied'),
      successful: confirmedStatuses.reduce((a, s) => a + c(s), 0),
      disputed: c('disputed'),
      turnover: sumOf('amount', confirmedStatuses),
      pendingAccrual: sumOf('commission', ['confirmed']),
      awaitingPayout: sumOf('commission', ['accrued']),
      paidOut: sumOf('commission', ['paid_out']),
      currency: 'UAH',
    });
  } catch (error) {
    console.error('Earnings error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
