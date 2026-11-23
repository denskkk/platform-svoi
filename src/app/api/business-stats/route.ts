/** GET /api/business-stats — показники кабінету бізнесу для власника: аудиторія, публікації, оголошення, переходи, угоди. */

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

    const info = await prisma.businessInfo.findUnique({ where: { userId }, select: { id: true } });
    if (!info) return NextResponse.json({ error: t('api.common.userNotFound') }, { status: 404 });

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [followers, favorites, posts, postLikes, listings, listingViews, clicks, clicks30, deals, program, newFollowers30] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.favorite.count({ where: { targetUserId: userId } }),
      prisma.post.count({ where: { authorId: userId } }),
      prisma.post.aggregate({ where: { authorId: userId }, _sum: { likesCount: true, commentsCount: true } }),
      prisma.listing.count({ where: { ownerId: userId, status: 'approved', expiresAt: { gt: new Date() } } }),
      prisma.listing.aggregate({ where: { ownerId: userId }, _sum: { viewsCount: true } }),
      prisma.outboundClick.count({ where: { listing: { ownerId: userId } } }),
      prisma.outboundClick.count({ where: { listing: { ownerId: userId }, createdAt: { gte: since } } }),
      prisma.deal.groupBy({ by: ['status'], where: { businessUserId: userId }, _count: { _all: true }, _sum: { amount: true, commission: true } }),
      prisma.referralProgram.findFirst({ where: { businessUserId: userId }, select: { percent: true, status: true } }),
      prisma.follow.count({ where: { followingId: userId, createdAt: { gte: since } } }),
    ]);

    const dealMap: Record<string, { count: number; amount: number; commission: number }> = {};
    for (const d of deals as any[]) dealMap[d.status] = { count: d._count._all, amount: Number(d._sum.amount || 0), commission: Number(d._sum.commission || 0) };
    const closed = ['confirmed', 'accrued', 'paid_out'];
    const closedDeals = closed.reduce((s, k) => s + (dealMap[k]?.count || 0), 0);
    const turnover = closed.reduce((s, k) => s + (dealMap[k]?.amount || 0), 0);
    const commissions = closed.reduce((s, k) => s + (dealMap[k]?.commission || 0), 0);

    return NextResponse.json({
      audience: { followers, newFollowers30, favorites },
      content: { posts, likes: postLikes._sum.likesCount || 0, comments: postLikes._sum.commentsCount || 0 },
      listings: { active: listings, views: listingViews._sum.viewsCount || 0, clicks, clicks30 },
      deals: { total: (deals as any[]).reduce((s, d) => s + d._count._all, 0), closed: closedDeals, turnover, commissions, open: (dealMap.lead_created?.count || 0) + (dealMap.customer_applied?.count || 0), disputed: dealMap.disputed?.count || 0 },
      program: program ? { percent: Number(program.percent), status: program.status } : null,
    });
  } catch (error) {
    console.error('Business stats error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
