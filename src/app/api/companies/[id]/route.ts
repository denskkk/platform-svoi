/** GET /api/companies/:userId — сторінка компанії (публічні поля) */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { isBlockedBetween } from '@/lib/blocks';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const viewerId = Number(auth.user.userId);

    const id = parseId(params.id);
    const c = id
      ? await prisma.businessInfo.findFirst({
          where: { userId: id, user: { isActive: true } },
          include: { user: { select: { id: true, isVerified: true, avgRating: true, totalReviews: true } } },
        })
      : null;
    if (!id || !c || (id !== viewerId && (await isBlockedBetween(viewerId, id)))) {
      return NextResponse.json({ error: t('api.common.userNotFound') }, { status: 404 });
    }

    const fav = id === viewerId
      ? null
      : await prisma.favorite.findUnique({ where: { userId_targetUserId: { userId: viewerId, targetUserId: id } }, select: { id: true } });
    const program = await prisma.referralProgram.findFirst({ where: { businessUserId: id, status: 'active' }, select: { percent: true } });
    const links = c.socialLinks && typeof c.socialLinks === 'object' ? (c.socialLinks as Record<string, unknown>) : {};

    return NextResponse.json({
      company: {
        id: c.userId,
        name: c.companyName,
        logoUrl: c.logoUrl,
        bannerUrl: c.bannerUrl,
        category: c.businessType || c.businessCategory || null,
        description: c.description,
        mission: c.mission,
        servicesList: c.servicesList,
        priceRange: c.priceRange,
        workHours: c.workHours,
        city: c.city,
        region: c.region,
        address: c.address || c.serviceLocation,
        latitude: c.latitude === null || c.latitude === undefined ? null : Number(c.latitude),
        longitude: c.longitude === null || c.longitude === undefined ? null : Number(c.longitude),
        phone: c.phone,
        email: c.email,
        website: c.website,
        telegram: c.telegram,
        viber: c.viber,
        contactName: c.representativeName,
        socialLinks: Object.fromEntries(Object.entries(links).filter(([, v]) => typeof v === 'string' && v)) as Record<string, string>,
        gallery: Array.isArray(c.gallery) ? (c.gallery as unknown[]).filter((u) => typeof u === 'string').slice(0, 12) : [],
        videoUrl: c.videoUrl,
        yearFounded: c.yearFounded,
        isVerified: c.user.isVerified,
        rating: Number(c.user.avgRating) || 0,
        reviewsCount: c.user.totalReviews || 0,
        referralPercent: program ? Number(program.percent) : null,
        isOwn: id === viewerId,
        isFavorite: !!fav,
      },
    });
  } catch (error) {
    console.error('Company page error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
