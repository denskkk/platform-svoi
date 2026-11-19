/**
 * GET /api/feed/public?videos=1&cursor=<postId>&limit=8
 *
 * Лише для читання, без входу: публічні дописи для гостей (лендинг -> стрічка / рілси).
 * Без стану користувача (лайки, підписки, закладки порожні). Приватні акаунти, заблоковані й допис спільнот не показуємо.
 * Щоб не навантажувати базу: максимум 10 дописів на сторінку, не глибше 5 сторінок, відповідь кешується на 20 с.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiT } from '@/i18n/server';
import { getPrivateAuthorIdsHiddenFrom } from '@/lib/userSettings';
import { parseId, postInclude, serializePost } from '@/lib/feed';

export const dynamic = 'force-dynamic';

const PAGE = 10;
const MAX_PAGES = 5;
const TTL_MS = 20_000;
const cache = new Map<string, { at: number; body: any }>();

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const p = new URL(request.url).searchParams;
    const cursor = parseId(p.get('cursor'));
    const videos = p.get('videos') === '1';
    const requested = Number(p.get('limit'));
    const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, PAGE) : PAGE;
    const pageIndex = Math.min(Math.max(Number(p.get('page')) || 0, 0), MAX_PAGES);
    if (pageIndex >= MAX_PAGES) return NextResponse.json({ posts: [], nextCursor: null, limited: true });

    const key = `${videos ? 'v' : 'a'}:${cursor ?? 0}:${limit}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return NextResponse.json(hit.body);

    const hidden = await getPrivateAuthorIdsHiddenFrom(0);
    const where: any = { isHidden: false, clubId: null, author: { isActive: true } };
    if (hidden.length) where.authorId = { notIn: hidden };
    if (cursor) where.id = { lt: cursor };
    if (videos) where.video = { is: { status: 'ready' } };

    const rows = await prisma.post.findMany({ where, orderBy: { id: 'desc' }, take: limit + 1, include: postInclude });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const empty = { userId: 0, liked: new Set<number>(), following: new Set<number>(), saved: new Set<number>(), reactions: new Map<number, string>() };
    const body = { posts: page.map((r: any) => serializePost(r, empty)), nextCursor: hasMore ? page[page.length - 1].id : null };

    cache.set(key, { at: Date.now(), body });
    if (cache.size > 200) {
      const now = Date.now();
      cache.forEach((v, k) => { if (now - v.at > TTL_MS) cache.delete(k); });
      if (cache.size > 200) cache.clear();
    }
    return NextResponse.json(body);
  } catch (error) {
    console.error('Public feed error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
