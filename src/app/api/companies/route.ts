/**
 * GET /api/companies?q=&city=&category=&cursor=<businessId>&limit=20
 * Каталог компаній (лише публічні поля). Для авторизованих; заблоковані та неактивні не показуються.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getBlockedIds } from '@/lib/blocks';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const limitCheck = checkRateLimit(`companies:${userId}`, { interval: 60 * 1000, maxRequests: 90 });
    if (!limitCheck.allowed) return NextResponse.json({ error: t('api.common.tooManyRequestsShort') }, { status: 429 });

    const params = new URL(request.url).searchParams;
    const q = (params.get('q') || '').trim().slice(0, 80);
    const city = (params.get('city') || '').trim().slice(0, 100);
    const category = (params.get('category') || '').trim().slice(0, 100);
    const cursor = parseId(params.get('cursor'));
    const requested = Number(params.get('limit'));
    const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, 50) : 20;

    const blocked = await getBlockedIds(userId);
    const contains = (field: string, v: string) => ({ [field]: { contains: v, mode: 'insensitive' as const } });
    const and: any[] = [{ user: { isActive: true, ...(blocked.length ? { id: { notIn: blocked } } : {}) } }];
    if (q) and.push({ OR: [contains('companyName', q), contains('businessType', q), contains('description', q), contains('servicesList', q)] });
    if (city) and.push(contains('city', city));
    if (category) and.push({ OR: [contains('businessType', category), contains('businessCategory', category)] });
    if (cursor) and.push({ id: { lt: cursor } });

    const rows = await prisma.businessInfo.findMany({
      where: { AND: and },
      orderBy: { id: 'desc' },
      take: limit + 1,
      select: {
        id: true, userId: true, companyName: true, logoUrl: true, bannerUrl: true, city: true, businessType: true, businessCategory: true, description: true,
        user: { select: { isVerified: true, avgRating: true, totalReviews: true } },
      },
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json({
      companies: page.map((c: any) => ({
        id: c.userId,
        name: c.companyName,
        logoUrl: c.logoUrl,
        bannerUrl: c.bannerUrl,
        city: c.city,
        category: c.businessType || c.businessCategory || null,
        description: c.description ? String(c.description).slice(0, 160) : null,
        isVerified: c.user.isVerified,
        rating: Number(c.user.avgRating) || 0,
        reviewsCount: c.user.totalReviews || 0,
      })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error('Companies list error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
