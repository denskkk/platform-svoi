/**
 * GET /api/recommendations — «Можливі знайомі» та «Рекомендовані бізнеси» для стрічки.
 * Спочатку з міста користувача, далі — найактивніші/нові. Без тих, на кого вже підписаний, власного акаунта
 * та заблокованих (в обидва боки). Лише публічні поля.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { getBlockedIds } from '@/lib/blocks';

export const dynamic = 'force-dynamic';

const LIMIT = 6;

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'VIEW_FEED');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const [me, blocked, follows] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { city: true } }),
      getBlockedIds(userId),
      prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    ]);
    const excluded = [userId, ...blocked, ...follows.map((f) => f.followingId)];
    const city = me?.city?.trim() || null;

    // Люди
    const personSelect = { id: true, firstName: true, lastName: true, avatarUrl: true, city: true, profession: true, isVerified: true } as const;
    const personBase = { isActive: true, id: { notIn: excluded }, accountType: { not: 'business' as const }, role: { in: ['user', 'business'] as ('user' | 'business')[] } };
    const sameCity = city
      ? await prisma.user.findMany({
          where: { ...personBase, city: { equals: city, mode: 'insensitive' } },
          select: personSelect, orderBy: [{ isVerified: 'desc' }, { id: 'desc' }], take: LIMIT,
        })
      : [];
    let people = sameCity;
    if (people.length < LIMIT) {
      const rest = await prisma.user.findMany({
        where: { ...personBase, id: { notIn: [...excluded, ...people.map((p) => p.id)] }, posts: { some: { isHidden: false } } },
        select: personSelect, orderBy: { id: 'desc' }, take: LIMIT - people.length,
      });
      people = [...people, ...rest];
    }

    // Бізнеси
    const bizSelect = { userId: true, companyName: true, logoUrl: true, city: true, businessType: true, user: { select: { isVerified: true } } } as const;
    const bizBase = { user: { isActive: true, id: { notIn: excluded } } };
    const bizSame = city
      ? await prisma.businessInfo.findMany({ where: { ...bizBase, city: { equals: city, mode: 'insensitive' } }, select: bizSelect, orderBy: { id: 'desc' }, take: LIMIT })
      : [];
    let business = bizSame;
    if (business.length < LIMIT) {
      const rest = await prisma.businessInfo.findMany({
        where: { user: { isActive: true, id: { notIn: [...excluded, ...business.map((b) => b.userId)] } } },
        select: bizSelect, orderBy: [{ user: { isVerified: 'desc' } }, { id: 'desc' }], take: LIMIT - business.length,
      });
      business = [...business, ...rest];
    }

    return NextResponse.json({
      people: people.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), avatarUrl: u.avatarUrl, city: u.city, subtitle: u.profession, isVerified: u.isVerified })),
      business: business.map((b) => ({ id: b.userId, name: b.companyName, avatarUrl: b.logoUrl, city: b.city, subtitle: b.businessType, isVerified: b.user.isVerified })),
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
