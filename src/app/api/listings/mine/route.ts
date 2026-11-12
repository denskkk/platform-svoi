/**
 * GET /api/listings/mine — усі оголошення поточного користувача (будь-який статус)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { listingInclude, serializeListing } from '@/lib/listings';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const rows = await prisma.listing.findMany({
      where: { ownerId: userId },
      orderBy: { id: 'desc' },
      take: 100,
      include: listingInclude,
    });
    return NextResponse.json({
      listings: rows.map((r) => ({ ...serializeListing(r as any, userId, new Set()), rejectReason: r.rejectReason, expiresAt: r.expiresAt?.toISOString() ?? null })),
    });
  } catch (error) {
    console.error('Get my listings error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
