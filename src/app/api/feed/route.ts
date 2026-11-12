/**
 * GET /api/feed?scope=all|following&cursor=<postId>&limit=10
 *
 * Стрічка дописів (нові зверху), курсорна пагінація за id допису.
 *  - scope=all        — усі публічні дописи
 *  - scope=following  — дописи тих, на кого підписаний користувач, та власні
 * Відповідь: { posts, nextCursor }  (nextCursor === null — це кінець стрічки)
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { FEED_LIMITS, loadViewerState, parseId, postInclude, serializePost } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'VIEW_FEED');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const params = new URL(request.url).searchParams;
    const scope = params.get('scope') === 'following' ? 'following' : 'all';
    const cursor = parseId(params.get('cursor'));
    const requested = Number(params.get('limit'));
    const limit = Number.isInteger(requested) && requested > 0
      ? Math.min(requested, FEED_LIMITS.maxPageSize)
      : FEED_LIMITS.pageSize;

    const where: Prisma.PostWhereInput = { isHidden: false, author: { isActive: true } };
    if (cursor) where.id = { lt: cursor };
    if (scope === 'following') {
      const follows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
      where.authorId = { in: [userId, ...follows.map((f) => f.followingId)] };
    }

    const rows = await prisma.post.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit + 1,
      include: postInclude,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const state = await loadViewerState(userId, page.map((p) => p.id), Array.from(new Set(page.map((p) => p.authorId))));

    return NextResponse.json({
      posts: page.map((p) => serializePost(p, state)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error('Get feed error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
