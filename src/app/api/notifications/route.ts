/**
 * GET /api/notifications?cursor=<id>&limit=20 — сповіщення користувача (нові зверху)
 * GET /api/notifications?countOnly=1           — лише { unreadCount } (для значка-дзвіночка)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const params = new URL(request.url).searchParams;
    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
    if (params.get('countOnly')) return NextResponse.json({ unreadCount });

    const cursor = parseId(params.get('cursor'));
    const requested = Number(params.get('limit'));
    const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, 50) : 20;

    const rows = await prisma.notification.findMany({
      where: { userId, ...(cursor ? { id: { lt: cursor } } : {}) },
      orderBy: { id: 'desc' },
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const actorIds = Array.from(new Set(page.map((n) => n.relatedUserId).filter((id): id is number => !!id)));
    const actors = actorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, businessInfo: { select: { companyName: true, logoUrl: true } } },
        })
      : [];
    const actorMap = new Map(actors.map((a) => [a.id, {
      id: a.id,
      name: a.businessInfo?.companyName || `${a.firstName} ${a.lastName}`.trim(),
      avatarUrl: a.businessInfo?.logoUrl || a.avatarUrl,
    }]));

    return NextResponse.json({
      unreadCount,
      notifications: page.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        relatedEntityType: n.relatedEntityType,
        relatedEntityId: n.relatedEntityId,
        actor: n.relatedUserId ? actorMap.get(n.relatedUserId) ?? null : null,
      })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
