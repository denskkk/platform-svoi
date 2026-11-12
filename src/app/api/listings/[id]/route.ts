/**
 * GET    /api/listings/:id — оголошення (схвалене — всім; своє або для адміна — у будь-якому статусі)
 * PATCH  /api/listings/:id — змінити своє оголошення (повертається на модерацію)
 * DELETE /api/listings/:id — видалити (власник або адміністратор)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { hasListings } from '@/lib/listingFields';
import { listingInclude, loadSavedIds, removeListingImageFiles, serializeListing, validateListing } from '@/lib/listings';
import { isBlockedBetween } from '@/lib/blocks';
import { logAudit } from '@/lib/audit';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

async function isAdmin(userId: number) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return !!me?.isAdmin;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'SAVE_LISTING');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const id = parseId(params.id);
    const row = id ? await prisma.listing.findUnique({ where: { id }, include: listingInclude }) : null;
    if (!row) return NextResponse.json({ error: t('api.listings.notFound') }, { status: 404 });

    const owner = row.ownerId === userId;
    const publiclyVisible = row.status === 'approved' && !!row.expiresAt && row.expiresAt > new Date();
    if (!owner && !publiclyVisible && !(await isAdmin(userId))) {
      return NextResponse.json({ error: t('api.listings.notFound') }, { status: 404 });
    }
    if (!owner && (await isBlockedBetween(userId, row.ownerId))) {
      return NextResponse.json({ error: t('api.listings.notFound') }, { status: 404 });
    }

    if (!owner && publiclyVisible) {
      await prisma.listing.update({ where: { id: row.id }, data: { viewsCount: { increment: 1 } } }).catch(() => undefined);
    }
    const saved = await loadSavedIds(prisma, userId, [row.id]);
    return NextResponse.json({ listing: serializeListing(row as any, userId, saved, { full: true }) });
  } catch (error) {
    console.error('Get listing error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'CREATE_LISTING');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const id = parseId(params.id);
    const existing = id ? await prisma.listing.findUnique({ where: { id }, select: { ownerId: true, projectSlug: true, images: { select: { url: true } } } }) : null;
    if (!id || !existing) return NextResponse.json({ error: t('api.listings.notFound') }, { status: 404 });
    if (existing.ownerId !== userId) return NextResponse.json({ error: t('api.listings.forbidden') }, { status: 403 });
    if (!hasListings(existing.projectSlug)) return NextResponse.json({ error: t('api.listings.projectInvalid') }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const result = validateListing(existing.projectSlug, body);
    if (!result.ok) return NextResponse.json({ error: t(`api.listings.${result.error}`), field: result.field }, { status: 400 });

    const v = result.value;
    const removedUrls = existing.images.map((i) => i.url).filter((u) => !v.images.includes(u));

    await prisma.$transaction([
      prisma.listingImage.deleteMany({ where: { listingId: id } }),
      prisma.listing.update({
        where: { id },
        data: {
          title: v.title, description: v.description, price: v.price, currency: v.currency, city: v.city,
          contactName: v.contactName, phone: v.phone, data: v.data,
          // Після редагування оголошення знову перевіряється модератором
          status: 'pending', rejectReason: null, expiresAt: null, moderatedAt: null, moderatedById: null,
          images: { create: v.images.map((url, position) => ({ url, position })) },
        },
      }),
    ]);
    await removeListingImageFiles(removedUrls);

    return NextResponse.json({ success: true, status: 'pending', message: t('api.listings.updated') });
  } catch (error) {
    console.error('Update listing error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const id = parseId(params.id);
    const row = id ? await prisma.listing.findUnique({ where: { id }, select: { ownerId: true, images: { select: { url: true } } } }) : null;
    if (!id || !row) return NextResponse.json({ error: t('api.listings.notFound') }, { status: 404 });

    const admin = row.ownerId !== userId && (await isAdmin(userId));
    if (row.ownerId !== userId && !admin) return NextResponse.json({ error: t('api.listings.forbidden') }, { status: 403 });

    await prisma.listing.delete({ where: { id } });
    await removeListingImageFiles(row.images.map((i) => i.url));
    if (admin) await logAudit({ actorId: userId, action: 'listing.delete', entityType: 'listing', entityId: id });

    return NextResponse.json({ success: true, message: t('api.listings.deleted') });
  } catch (error) {
    console.error('Delete listing error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
