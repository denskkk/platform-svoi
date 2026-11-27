/**
 * GET /api/friends?tab=following|followers|mutual&userId=<id>&q=текст&cursor=<followId>&limit=20
 * Без userId — мої списки. З userId — списки іншої людини (якщо вона не сховала їх у налаштуваннях приватності; «взаємні» лише для себе).
 * Список підписок / підписників / взаємних підписок поточного користувача з пошуком за ім’ям.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { authorSelect, parseId } from '@/lib/feed';
import { getBlockedIds } from '@/lib/blocks';
import { getSettings } from '@/lib/userSettings';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'VIEW_FEED');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const search = new URL(request.url).searchParams;
    const viewerId = userId;
    const targetParam = parseId(search.get('userId'));
    const targetId = targetParam && targetParam !== viewerId ? targetParam : viewerId;
    const isSelf = targetId === viewerId;
    let tab: 'following' | 'followers' | 'mutual' = search.get('tab') === 'followers' ? 'followers' : search.get('tab') === 'mutual' ? 'mutual' : 'following';
    let ownerName: string | null = null;
    if (!isSelf) {
      if (tab === 'mutual') tab = 'following';
      const owner = await prisma.user.findUnique({ where: { id: targetId }, select: { isActive: true, firstName: true, lastName: true, businessInfo: { select: { companyName: true } } } });
      if (!owner?.isActive) return NextResponse.json({ error: t('api.common.userNotFound') }, { status: 404 });
      ownerName = owner.businessInfo?.companyName || `${owner.firstName} ${owner.lastName}`.trim();
      const st = await getSettings(targetId);
      if (st.privacy.showFollowing === 'me') return NextResponse.json({ error: 'private', private: true, ownerName }, { status: 403 });
    }
    const q = (search.get('q') || '').trim().slice(0, 60);
    const cursor = parseId(search.get('cursor'));
    const requested = Number(search.get('limit'));
    const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, 50) : 20;

    const blocked = await getBlockedIds(viewerId);
    // «other» — це людина, що показується у рядку; «me» — поточний користувач
    const otherField = tab === 'followers' ? 'follower' : 'following';
    const otherIdField = tab === 'followers' ? 'followerId' : 'followingId';

    const userFilter: any = { isActive: true };
    if (blocked.length) userFilter.id = { notIn: blocked };
    if (q) {
      userFilter.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { businessInfo: { is: { companyName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const where: any = {
      ...(tab === 'followers' ? { followingId: targetId } : { followerId: targetId }),
      [otherField]: userFilter,
      ...(cursor ? { id: { lt: cursor } } : {}),
    };
    if (tab === 'mutual') {
      // Взаємні: ті, на кого я підписаний і хто підписаний на мене
      where.following = { ...userFilter, following: { some: { followingId: viewerId } } };
    }

    const rows = await prisma.follow.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit + 1,
      select: { id: true, followerId: true, followingId: true, [otherField]: { select: authorSelect } },
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const ids: number[] = page.map((r: any) => r[otherIdField]);
    const mine = ids.length
      ? await prisma.follow.findMany({ where: { followerId: viewerId, followingId: { in: ids } }, select: { followingId: true } })
      : [];
    const iFollow = new Set<number>(mine.map((m: any) => m.followingId));

    const [followingCount, followersCount] = await Promise.all([
      prisma.follow.count({ where: { followerId: targetId } }),
      prisma.follow.count({ where: { followingId: targetId } }),
    ]);

    return NextResponse.json({
      users: page.map((r: any) => {
        const u = r[otherField];
        return {
          id: u.id,
          name: u.businessInfo?.companyName || `${u.firstName} ${u.lastName}`.trim(),
          avatarUrl: u.businessInfo?.logoUrl || u.avatarUrl,
          subtitle: u.profession || u.city || null,
          isVerified: u.isVerified,
          isFollowing: iFollow.has(u.id),
        };
      }),
      nextCursor: hasMore ? page[page.length - 1].id : null,
      counts: { following: followingCount, followers: followersCount },
      self: isSelf,
      ownerName,
    });
  } catch (error) {
    console.error('Friends list error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
