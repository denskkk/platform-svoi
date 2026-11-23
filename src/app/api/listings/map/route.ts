/**
 * GET /api/listings/map?project= — учасники проєкту за країнами / областями / містами для «Карти учасників».
 * Показуються лише схвалені оголошення, власник яких дозволив показ місця (поле showOnMap = yes). Точних адрес і контактів немає.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { hasListings } from '@/lib/listingFields';
import { publicWhere } from '@/lib/listings';

export const dynamic = 'force-dynamic';
const norm = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ');

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'SAVE_LISTING');
    if (auth.error) return auth.error;
    const slug = new URL(request.url).searchParams.get('project') || '';
    if (!hasListings(slug)) return NextResponse.json({ error: t('api.listings.projectInvalid') }, { status: 400 });
    const rows = await prisma.listing.findMany({
      where: { AND: [publicWhere(slug), { data: { path: ['showOnMap'], equals: 'yes' } }] },
      select: { city: true, data: true }, take: 5000,
    });
    const groups = new Map<string, { country: string; region: string; city: string; count: number }>();
    rows.forEach((r: any) => {
      const country = norm(r.data?.country), region = norm(r.data?.region), city = norm(r.city);
      if (!country && !city) return;
      const key = `${country}|${region}|${city}`.toLowerCase();
      const cur = groups.get(key);
      if (cur) cur.count += 1; else groups.set(key, { country, region, city, count: 1 });
    });
    const places = Array.from(groups.values()).sort((a, b) => b.count - a.count || a.country.localeCompare(b.country)).slice(0, 500);
    return NextResponse.json({ places, total: rows.length });
  } catch (e) {
    console.error('[listings map]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
