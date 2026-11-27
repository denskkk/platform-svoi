/**
 * GET /api/feed?scope=all|following&cursor=<postId>&limit=10
 *
 * Стрічка дописів (нові зверху), курсорна пагінація за id допису.
 *  - scope=all        — усі публічні дописи
 *  - scope=following  — дописи тих, на кого підписаний користувач, та власні
 * Додатково: reposts=1 — лише репости; reacted=1 — мої лайки й коментарі; saved=1 — лише збережені користувачем дописи; authorId=ID — лише дописи одного автора (для сторінки профілю).
 * Відповідь: { posts, nextCursor }  (nextCursor === null — це кінець стрічки)
 */

import { getClubAccess } from '@/lib/clubAccess';
import { getPrivateAuthorIdsHiddenFrom, getSettings } from '@/lib/userSettings';
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

    // Приховані: заблоковані та автори приватних акаунтів, на яких я не підписаний
    const blocked = [...(await getBlockedIds(userId)), ...(await getPrivateAuthorIdsHiddenFrom(userId))];
    const where: Prisma.PostWhereInput = { isHidden: false, author: { isActive: true } };
    // Дописи спільнот живуть лише на дошці своєї спільноти й не потрапляють у загальну стрічку
    const clubParam = parseId(params.get('clubId'));
    if (clubParam) {
      const access = await getClubAccess(clubParam, userId);
      if (!access) return NextResponse.json({ posts: [], nextCursor: null });
      if (!access.canSee) return NextResponse.json({ error: t('api.clubs.membersOnly') }, { status: 403 });
      (where as any).clubId = clubParam;
    } else {
      (where as any).clubId = null;
    }
    // Вкладка «Бізнес» у рілсах: лише відео бізнес-акаунтів
    if (params.get('scope') === 'business') where.author = { isActive: true, accountType: 'business' } as any;
    if (cursor) where.id = { lt: cursor };
    if (params.get('videos') === '1') where.videos = { some: { status: 'ready' } };
    // Вкладки профілю «Фото» й «Відео» окремо
    if (params.get('media') === 'photo') where.images = { some: {} };
    if (params.get('media') === 'video') where.videos = { some: { status: 'ready' } };
    const authorId = parseId(params.get('authorId'));
    // reposts=1 — лише репости (для вкладки профілю); reacted=1 — дописи, які поточний користувач лайкнув або прокоментував
    if (params.get('reposts') === '1') (where as any).repostOfId = { not: null };
    if (params.get('reacted') === '1') (where as any).OR = [{ likes: { some: { userId } } }, { comments: { some: { authorId: userId } } }];
    // private=1 — власні закриті дописи (вкладка із замком); в усіх інших вибірках закриті дописи не показуються
    const privateTab = params.get('private') === '1';
    (where as any).isPrivate = privateTab;
    if (privateTab) {
      where.authorId = userId;
    } else if (params.get('saved') === '1') {
      const rows = await prisma.savedPost.findMany({ where: { userId }, select: { postId: true }, orderBy: { id: 'desc' }, take: 1000 });
      where.id = { ...(cursor ? { lt: cursor } : {}), in: rows.map((r: any) => r.postId) };
      if (blocked.length > 0) where.authorId = { notIn: blocked };
    } else if (params.get('reacted') === '1') {
      if (blocked.length > 0) where.authorId = { notIn: blocked };
    } else if (authorId) {
      if (blocked.includes(authorId)) return NextResponse.json({ posts: [], nextCursor: null });
      where.authorId = authorId;
    } else if (scope === 'following') {
      const follows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
      where.authorId = { in: [userId, ...follows.map((f: any) => f.followingId).filter((id: any) => !blocked.includes(id))] };
    } else {
      if (blocked.length > 0) where.authorId = { notIn: blocked };
      // «Де дивитись»: якщо людина вказала в налаштуваннях область/країну, у «Для вас» першими йдуть автори звідти,
      // а також ті, на кого вона підписана, і вона сама. Якщо не вказала — стрічка загальна.
      if (!clubParam && params.get('videos') !== '1') {
        const pref = (await getSettings(userId)).feed;
        const place = pref.scope === 'country' ? pref.country : pref.scope === 'region' ? pref.region : pref.scope === 'city' ? pref.city : '';
        if (place) {
          const follows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
          // У профілі немає окремого поля «країна»: збіг шукаємо в області/регіоні та місті (напр. «Польща», «Київська», «Варшава»)
          const near: any[] = [
            { author: { region: { contains: place, mode: 'insensitive' } } },
            { author: { city: { contains: place, mode: 'insensitive' } } },
          ];
          (where as any).AND = [{ OR: [...near, { authorId: { in: [userId, ...follows.map((f: any) => f.followingId)] } }] }];
        }
      }
    }

    const rows = await prisma.post.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit + 1,
      include: postInclude,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const state = await loadViewerState(userId, page.map((p: any) => p.id), Array.from(new Set(page.map((p: any) => p.authorId))));

    return NextResponse.json({
      posts: page.map((p: any) => serializePost(p, state)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error('Get feed error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
