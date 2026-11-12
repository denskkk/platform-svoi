/**
 * GET /api/feed?scope=all|following&cursor=<postId>&limit=10
 *
 * Стрічка дописів (нові зверху), курсорна пагінація за id допису.
 *  - scope=all        — усі публічні дописи
 *  - scope=following  — дописи тих, на кого підписаний користувач, та власні
 * Додатково: saved=1 — лише збережені користувачем дописи; authorId=ID — лише дописи одного автора (для сторінки профілю).
 * Відповідь: { posts, nextCursor }  (nextCursor === null — це кінець стрічки)
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { getBlockedIds } from '@/lib/blocks';
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

    const blocked = await getBlockedIds(userId);
    const where: Prisma.PostWhereInput = { isHidden: false, author: { isActive: true } };
    if (cursor) where.id = { lt: cursor };
    const authorId = parseId(params.get('authorId'));
    if (params.get('saved') === '1') {
      const rows = await prisma.savedPost.findMany({ where: { userId }, select: { postId: true }, orderBy: { id: 'desc' }, take: 1000 });
      where.id = { ...(cursor ? { lt: cursor } : {}), in: rows.map((r) => r.postId) };
      if (blocked.length > 0) where.authorId = { notIn: blocked };
    } else if (authorId) {
      if (blocked.includes(authorId)) return NextResponse.json({ posts: [], nextCursor: null });
      where.authorId = authorId;
    } else if (scope === 'following') {
      const follows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
      where.authorId = { in: [userId, ...follows.map((f) => f.followingId).filter((id) => !blocked.includes(id))] };
    } else if (blocked.length > 0) {
      where.authorId = { notIn: blocked };
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
