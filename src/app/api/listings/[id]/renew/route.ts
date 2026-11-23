/**
 * POST /api/listings/:id/renew — продовжити публікацію ще на 30 днів
 * (лише власник; лише для схвалених оголошень, включно з тими, що вже завершилися).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { LISTING_LIMITS } from '@/lib/listingFields';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'CREATE_LISTING');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const id = parseId(params.id);
    const row = id ? await prisma.listing.findUnique({ where: { id }, select: { ownerId: true, status: true, expiresAt: true } }) : null;
    if (!id || !row) return NextResponse.json({ error: t('api.listings.notFound') }, { status: 404 });
    if (row.ownerId !== userId) return NextResponse.json({ error: t('api.listings.forbidden') }, { status: 403 });
    if (row.status !== 'approved') return NextResponse.json({ error: t('api.listings.renewNotAllowed') }, { status: 400 });

    const base = row.expiresAt && row.expiresAt > new Date() ? row.expiresAt : new Date();
    const expiresAt = new Date(base.getTime() + LISTING_LIMITS.publishDays * 24 * 60 * 60 * 1000);
    await prisma.listing.update({ where: { id }, data: { expiresAt } });

    return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString(), message: t('api.listings.renewed') });
  } catch (error) {
    console.error('Renew listing error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
