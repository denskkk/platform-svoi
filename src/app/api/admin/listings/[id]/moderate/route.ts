/**
 * POST /api/admin/listings/:id/moderate { action: 'approve' | 'reject', reason? }
 * Схвалення відкриває оголошення в каталозі на 30 днів; відхилення потребує причини.
 * Дія фіксується в журналі аудиту, власник отримує сповіщення.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminPermission } from '@/lib/adminAccess';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { LISTING_LIMITS } from '@/lib/listingFields';
import { logAudit } from '@/lib/audit';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest, idParam: string) {
  const t = getApiT(request);
  try {
    const adminId = Number((request as any).user?.userId);
    if (!adminId || !(await hasAdminPermission(adminId, 'listings.moderate'))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });

    const id = parseId(idParam);
    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
    if (action !== 'approve' && action !== 'reject') return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    if (action === 'reject' && !reason) return NextResponse.json({ error: t('api.listings.reasonRequired') }, { status: 400 });

    const row = id ? await prisma.listing.findUnique({ where: { id }, select: { ownerId: true, status: true, title: true } }) : null;
    if (!id || !row) return NextResponse.json({ error: t('api.listings.notFound') }, { status: 404 });

    const approve = action === 'approve';
    // Умова на статус захищає від подвійної обробки (два модератори одночасно)
    const updated = await prisma.listing.updateMany({
      where: { id, status: 'pending' },
      data: approve
        ? { status: 'approved', rejectReason: null, moderatedAt: new Date(), moderatedById: adminId, expiresAt: new Date(Date.now() + LISTING_LIMITS.publishDays * 86400000) }
        : { status: 'rejected', rejectReason: reason, moderatedAt: new Date(), moderatedById: adminId, expiresAt: null },
    });
    if (updated.count === 0) return NextResponse.json({ error: t('api.listings.alreadyModerated') }, { status: 409 });

    await logAudit({ actorId: adminId, action: approve ? 'listing.approve' : 'listing.reject', entityType: 'listing', entityId: id, details: approve ? undefined : { reason } });

    try {
      await prisma.notification.create({
        data: {
          userId: row.ownerId,
          type: approve ? 'listing_approved' : 'listing_rejected',
          title: approve ? 'Ваше оголошення схвалено' : 'Ваше оголошення відхилено', // i18n-ignore
          message: approve ? row.title : reason,
          relatedEntityType: 'listing',
          relatedEntityId: id,
        },
      });
    } catch (e) {
      console.error('Listing notification error:', e);
    }

    return NextResponse.json({ success: true, status: approve ? 'approved' : 'rejected' });
  } catch (error) {
    console.error('Moderate listing error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, (req) => handler(req, params.id));
}
