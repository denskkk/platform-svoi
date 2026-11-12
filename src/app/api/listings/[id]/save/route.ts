/**
 * POST   /api/listings/:id/save — зберегти оголошення
 * DELETE /api/listings/:id/save — прибрати зі збережених
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

async function setSaved(request: NextRequest, idParam: string, save: boolean) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'SAVE_LISTING');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const listingId = parseId(idParam);
    const exists = listingId ? await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } }) : null;
    if (!listingId || !exists) return NextResponse.json({ error: t('api.listings.notFound') }, { status: 404 });

    if (save) {
      await prisma.savedListing.createMany({ data: [{ userId, listingId }], skipDuplicates: true });
    } else {
      await prisma.savedListing.deleteMany({ where: { userId, listingId } });
    }
    return NextResponse.json({ success: true, saved: save });
  } catch (error) {
    console.error('Save listing error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return setSaved(request, params.id, true);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return setSaved(request, params.id, false);
}
