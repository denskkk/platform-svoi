/**
 * GET /api/admin/listings?status=pending|approved|rejected&cursor=<id> — черга модерації (лише адміністратор)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminPermission } from '@/lib/adminAccess';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { listingInclude, serializeListing } from '@/lib/listings';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  const t = getApiT(request);
  try {
    const userId = Number((request as any).user?.userId);
    if (!userId || !(await hasAdminPermission(userId, 'listings.moderate'))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });

    const params = new URL(request.url).searchParams;
    const status = ['pending', 'approved', 'rejected'].includes(params.get('status') || '') ? (params.get('status') as string) : 'pending';
    const cursor = parseId(params.get('cursor'));

    const rows = await prisma.listing.findMany({
      where: { status, ...(cursor ? { id: status === 'pending' ? { gt: cursor } : { lt: cursor } } : {}) },
      orderBy: status === 'pending' ? { id: 'asc' } : { id: 'desc' },
      take: 21,
      include: listingInclude,
    });
    const hasMore = rows.length > 20;
    const page = hasMore ? rows.slice(0, 20) : rows;

    return NextResponse.json({
      listings: page.map((r: any) => ({ ...serializeListing(r as any, userId, new Set(), { full: true }), rejectReason: r.rejectReason })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error('Admin listings error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler);
}
