/** GET /api/me/cabinet — лічильники кабінету: підписники, підписки, лайки, запрошені (лише число), угоди, перегляди, статус. */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { ensureRefCode, isActiveParticipant, COMPLETED_DEAL_STATUSES } from '@/lib/invites';
import { getSettings } from '@/lib/userSettings';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const id = Number(user.userId);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [followers, following, likes, invited, dealsAsReferrer, dealsAsBusiness, views, refCode, settings, me] = await Promise.all([
      prisma.follow.count({ where: { followingId: id } }),
      prisma.follow.count({ where: { followerId: id } }),
      prisma.post.aggregate({ where: { authorId: id, isHidden: false }, _sum: { likesCount: true } }),
      prisma.user.count({ where: { referredById: id } }),
      prisma.deal.count({ where: { referrerId: id, status: { in: COMPLETED_DEAL_STATUSES } } }),
      prisma.deal.count({ where: { businessUserId: id, status: { in: COMPLETED_DEAL_STATUSES } } }),
      prisma.profileView.count({ where: { profileId: id, createdAt: { gte: since } } }),
      ensureRefCode(id),
      getSettings(id),
      prisma.user.findUnique({ where: { id }, select: { accountType: true, firstName: true, lastName: true, avatarUrl: true } }),
    ]);
    const completedDeals = dealsAsReferrer + dealsAsBusiness;
    return NextResponse.json({
      followers, following,
      likes: likes?._sum?.likesCount ?? 0,
      invited, completedDeals,
      isActiveParticipant: isActiveParticipant(invited, completedDeals),
      profileViews30d: settings.privacy.showProfileViewers ? views : null,
      refCode,
      isBusiness: me?.accountType === 'business',
      name: `${me?.firstName ?? ''} ${me?.lastName ?? ''}`.trim(),
      avatarUrl: me?.avatarUrl ?? null,
    });
  } catch (e) {
    console.error('[me/cabinet]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
