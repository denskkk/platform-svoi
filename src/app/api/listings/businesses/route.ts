/**
 * GET /api/listings/businesses?project=shops&f_section=<id>
 * Бізнес-кабінети, які мають схвалені оголошення в розділі (відділі) проєкту:
 * «Крамниця» веде не в стрічку товарів, а до кабінетів продавців.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { hasListings } from '@/lib/listingFields';
import { buildCatalogWhere, listingInclude, publicWhere } from '@/lib/listings';
import { getBlockedIds } from '@/lib/blocks';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'SAVE_LISTING');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);
    const params = new URL(request.url).searchParams;
    const slug = params.get('project');
    if (!slug || !hasListings(slug)) return NextResponse.json({ error: t('api.listings.projectInvalid') }, { status: 400 });

    const blocked = await getBlockedIds(userId);
    const rows = await prisma.listing.findMany({
      where: { AND: [publicWhere(slug), buildCatalogWhere(slug, params), blocked.length ? { ownerId: { notIn: blocked } } : {}] },
      orderBy: { id: 'desc' },
      take: 500,
      include: listingInclude,
    });

    const map = new Map<number, { id: number; name: string; logoUrl: string | null; isVerified: boolean; count: number; city: string | null }>();
    for (const r of rows as any[]) {
      const cur = map.get(r.ownerId);
      if (cur) { cur.count += 1; continue; }
      const o = r.owner;
      map.set(r.ownerId, {
        id: r.ownerId,
        name: o.businessInfo?.companyName || `${o.firstName} ${o.lastName}`.trim(),
        logoUrl: o.businessInfo?.logoUrl || o.avatarUrl || null,
        isVerified: !!o.isVerified,
        count: 1,
        city: r.city || null,
      });
    }
    return NextResponse.json({ businesses: Array.from(map.values()) });
  } catch (error) {
    console.error('Get listing businesses error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
