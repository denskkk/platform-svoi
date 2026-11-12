/**
 * GET  /api/listings?project=cars&q=&city=&priceMin=&priceMax=&f_<key>=…&saved=1&cursor=<id>&limit=12
 *      Каталог схвалених оголошень (нові зверху). saved=1 — збережені поточного користувача.
 * POST /api/listings { projectSlug, title, description, price, currency, city, phone, contactName, data, images }
 *      Подати оголошення. Потрапляє на модерацію (status = pending).
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { getApiT } from '@/i18n/server';
import { getProject } from '@/lib/projects';
import { hasListings, LISTING_LIMITS } from '@/lib/listingFields';
import { buildCatalogWhere, listingInclude, loadSavedIds, publicWhere, serializeListing, validateListing } from '@/lib/listings';
import { getBlockedIds } from '@/lib/blocks';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'SAVE_LISTING');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const params = new URL(request.url).searchParams;
    const slug = params.get('project');
    const savedOnly = params.get('saved') === '1';
    if (!savedOnly && (!slug || !hasListings(slug))) {
      return NextResponse.json({ error: t('api.listings.projectInvalid') }, { status: 400 });
    }

    const cursor = parseId(params.get('cursor'));
    const requested = Number(params.get('limit'));
    const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, LISTING_LIMITS.maxPageSize) : LISTING_LIMITS.pageSize;

    const blocked = await getBlockedIds(userId);
    const where: Prisma.ListingWhereInput = {
      AND: [
        publicWhere(savedOnly ? null : slug),
        savedOnly ? { saves: { some: { userId } } } : buildCatalogWhere(slug as string, params),
        blocked.length ? { ownerId: { notIn: blocked } } : {},
        cursor ? { id: { lt: cursor } } : {},
      ],
    };

    const rows = await prisma.listing.findMany({ where, orderBy: { id: 'desc' }, take: limit + 1, include: listingInclude });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const saved = await loadSavedIds(prisma, userId, page.map((r) => r.id));

    return NextResponse.json({
      listings: page.map((r) => serializeListing(r as any, userId, saved)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error('Get listings error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'CREATE_LISTING');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const limit = checkRateLimit(`listing:create:${userId}`, { interval: 24 * 60 * 60 * 1000, maxRequests: 20 });
    if (!limit.allowed) return NextResponse.json({ error: t('api.listings.tooMany') }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const slug = String(body?.projectSlug || '');
    const project = hasListings(slug) ? await getProject(slug) : null;
    if (!project || project.status !== 'active') {
      return NextResponse.json({ error: t('api.listings.projectInvalid') }, { status: 400 });
    }

    const result = validateListing(slug, body);
    if (!result.ok) {
      return NextResponse.json({ error: t(`api.listings.${result.error}`), field: result.field }, { status: 400 });
    }

    const pending = await prisma.listing.count({ where: { ownerId: userId, status: 'pending' } });
    if (pending >= LISTING_LIMITS.maxPendingPerUser) {
      return NextResponse.json({ error: t('api.listings.tooManyPending', { max: LISTING_LIMITS.maxPendingPerUser }) }, { status: 429 });
    }

    const v = result.value;
    const listing = await prisma.listing.create({
      data: {
        projectSlug: slug,
        ownerId: userId,
        title: v.title,
        description: v.description,
        price: v.price,
        currency: v.currency,
        city: v.city,
        contactName: v.contactName,
        phone: v.phone,
        data: v.data,
        status: 'pending',
        images: { create: v.images.map((url, position) => ({ url, position })) },
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, id: listing.id, status: 'pending', message: t('api.listings.submitted') }, { status: 201 });
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
