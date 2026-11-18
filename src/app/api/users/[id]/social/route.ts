/** GET /api/users/:id/social — лічильники профілю (дописи, підписники, підписки) і чи підписаний поточний користувач */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';
import { isBlockedBetween } from '@/lib/blocks';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'VIEW_FEED');
    if (auth.error) return auth.error;
    const viewerId = Number(auth.user.userId);

    const userId = parseId(params.id);
    if (!userId) return NextResponse.json({ error: t('api.common.userNotFound') }, { status: 404 });
    if (userId !== viewerId && (await isBlockedBetween(viewerId, userId))) {
      return NextResponse.json({ error: t('api.common.userNotFound') }, { status: 404 });
    }

    const [posts, followers, following, mine] = await Promise.all([
      prisma.post.count({ where: { authorId: userId, isHidden: false } }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      userId === viewerId
        ? Promise.resolve(null)
        : prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: userId } }, select: { id: true } }),
    ]);

    return NextResponse.json({ posts, followers, following, isFollowing: !!mine });
  } catch (error) {
    console.error('Profile social stats error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
