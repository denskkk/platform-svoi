/**
 * GET /api/recommendations — «Можливі знайомі», «Рекомендовані бізнеси» (за містом і заповненою анкетою) та
 * «Бізнес, який вам буде цікавий» (бізнеси, чиї ВЛАСНІ критерії аудиторії — стать, вік, регіон — підходять вам).
 * Спочатку з міста користувача, далі — найактивніші/нові. Без тих, на кого вже підписаний, власного акаунта
 * та заблокованих (в обидва боки). Лише публічні поля.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { getBlockedIds } from '@/lib/blocks';
import { DEFAULT_SETTINGS, normalizeSettings } from '@/lib/userSettings';

export const dynamic = 'force-dynamic';

const LIMIT = 6;

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'VIEW_FEED');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const [me, blocked, follows] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { city: true, region: true, gender: true, age: true } }),
      getBlockedIds(userId),
      prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    ]);
    const excluded = [userId, ...blocked, ...follows.map((f: any) => f.followingId)];
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
        where: { ...personBase, id: { notIn: [...excluded, ...people.map((p: any) => p.id)] }, posts: { some: { isHidden: false } } },
        select: personSelect, orderBy: { id: 'desc' }, take: LIMIT - people.length,
      });
      people = [...people, ...rest];
    }

    // Бізнеси
    const bizSelect = { userId: true, companyName: true, logoUrl: true, bannerUrl: true, city: true, businessType: true, user: { select: { isVerified: true } } } as const;
    const bizBase = { user: { isActive: true, id: { notIn: excluded } } };
    const bizSame = city
      ? await prisma.businessInfo.findMany({ where: { ...bizBase, city: { equals: city, mode: 'insensitive' } }, select: bizSelect, orderBy: { id: 'desc' }, take: LIMIT })
      : [];
    let business = bizSame;
    if (business.length < LIMIT) {
      const rest = await prisma.businessInfo.findMany({
        where: { user: { isActive: true, id: { notIn: [...excluded, ...business.map((b: any) => b.userId)] } } },
        select: bizSelect, orderBy: [{ user: { isVerified: 'desc' } }, { id: 'desc' }], take: LIMIT - business.length,
      });
      business = [...business, ...rest];
    }

    // «Бізнес, який вам буде цікавий»: бізнес сам задав критерії (стать / вік / регіон) у налаштуваннях і ви під них підходите.
    // Бізнеси зі стандартними (порожніми) критеріями сюди не потрапляють — вони підходять усім, це вже «Рекомендовані».
    const shownIds = new Set<number>(business.map((b: any) => b.userId));
    const region = (me?.region || '').trim().toLowerCase();
    const myCity = (me?.city || '').trim().toLowerCase();
    const candidates = await prisma.userSettings.findMany({
      where: { user: { isActive: true, businessInfo: { isNot: null }, id: { notIn: excluded } } },
      select: { userId: true, data: true, user: { select: { isVerified: true, businessInfo: { select: bizSelect } } } },
      take: 400,
    });
    const interesting = candidates.filter((c: any) => {
      const bi = c.user?.businessInfo;
      if (!bi) return false;
      const b = normalizeSettings(c.data ?? {}).business;
      const d = DEFAULT_SETTINGS.business;
      const hasCriteria = b.targetGender !== 'all' || !!b.targetRegion || !!b.targetCountry || b.targetAgeMin !== d.targetAgeMin || b.targetAgeMax !== d.targetAgeMax;
      if (!hasCriteria) return false;
      if (b.targetGender !== 'all' && me?.gender !== b.targetGender) return false;
      if (me?.age != null && (me.age < b.targetAgeMin || me.age > b.targetAgeMax)) return false;
      if (b.targetRegion) {
        const want = b.targetRegion.trim().toLowerCase();
        if (want !== region && want !== myCity) return false;
      }
      return true;
    }).filter((c: any) => !shownIds.has(c.userId)).slice(0, LIMIT);

    return NextResponse.json({
      interesting: interesting.map((c: any) => { const b = c.user.businessInfo; return { id: c.userId, name: b.companyName, avatarUrl: b.logoUrl, bannerUrl: b.bannerUrl, city: b.city, subtitle: b.businessType, isVerified: c.user.isVerified }; }),
      people: people.map((u: any) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), avatarUrl: u.avatarUrl, city: u.city, subtitle: u.profession, isVerified: u.isVerified })),
      business: business.map((b: any) => ({ id: b.userId, name: b.companyName, avatarUrl: b.logoUrl, bannerUrl: b.bannerUrl, city: b.city, subtitle: b.businessType, isVerified: b.user.isVerified })),
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
