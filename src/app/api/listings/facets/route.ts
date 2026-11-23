/**
 * GET /api/listings/facets?project=&section=&field=country|region|city|breed&<вже обрані поля>=…
 * «Папки» з наявних оголошень розділу: унікальні значення поля з кількістю (регістр і пробіли не створюють дублікатів).
 * Показуються лише значення, за якими є схвалені оголошення.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { fieldsFor, hasListings } from '@/lib/listingFields';
import { findSection } from '@/lib/projectFolders';
import { publicWhere } from '@/lib/listings';

export const dynamic = 'force-dynamic';
const FIELDS = ['country', 'region', 'city', 'breed'];
const norm = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ');

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'SAVE_LISTING');
    if (auth.error) return auth.error;
    const params = new URL(request.url).searchParams;
    const slug = params.get('project') || '';
    const section = params.get('section') || '';
    const field = params.get('field') || '';
    const valid = hasListings(slug) && !!findSection(slug, section) && FIELDS.includes(field) && (field === 'city' || fieldsFor(slug).some((f) => f.key === field));
    if (!valid) return NextResponse.json({ error: t('api.listings.projectInvalid') }, { status: 400 });

    const rows = await prisma.listing.findMany({
      where: { AND: [publicWhere(slug), { data: { path: ['section'], equals: section } }] },
      select: { city: true, data: true },
      take: 5000,
    });
    const read = (row: { city: string | null; data: any }, key: string) => norm(key === 'city' ? row.city : row.data?.[key]);
    const parents = FIELDS.filter((f) => f !== field && params.get(f));
    const counts = new Map<string, { value: string; count: number }>();
    rows.forEach((row: any) => {
      if (!parents.every((p) => read(row, p).toLowerCase() === norm(params.get(p)).toLowerCase())) return;
      const value = read(row, field);
      if (!value) return;
      const key = value.toLowerCase();
      const cur = counts.get(key);
      if (cur) cur.count += 1; else counts.set(key, { value, count: 1 });
    });
    const options = Array.from(counts.values()).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)).slice(0, 200);
    return NextResponse.json({ options });
  } catch (e) {
    console.error('[listings facets]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
