/**
 * POST   /api/clubs/:id/join — вступити
 * DELETE /api/clubs/:id/join — вийти (творець вийти не може — лише видалити клуб)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { isBlockedBetween } from '@/lib/blocks';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

async function setMembership(request: NextRequest, idParam: string, join: boolean) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);
    if (!checkRateLimit(`club:join:${userId}`, { interval: 60 * 60 * 1000, maxRequests: 60 }).allowed) {
      return NextResponse.json({ error: t('api.feed.tooManyActions') }, { status: 429 });
    }
    const id = parseId(idParam);
    const club = id ? await prisma.club.findFirst({ where: { id, isHidden: false }, select: { id: true, ownerId: true, joinMode: true, name: true } }) : null;
    if (!id || !club) return NextResponse.json({ error: t('api.clubs.notFound') }, { status: 404 });
    if (join && (await isBlockedBetween(userId, club.ownerId))) return NextResponse.json({ error: t('api.feed.blocked') }, { status: 403 });
    if (!join && club.ownerId === userId) return NextResponse.json({ error: t('api.clubs.ownerCannotLeave') }, { status: 400 });

    let pending = false;
    const membersCount = await prisma.$transaction(async (tx: any) => {
      if (join) {
        const needsApproval = club.joinMode === 'approval' && club.ownerId !== userId;
        const existing = await tx.clubMember.findUnique({ where: { clubId_userId: { clubId: id, userId } }, select: { status: true } });
        if (!existing) {
          await tx.clubMember.create({ data: { clubId: id, userId, status: needsApproval ? 'pending' : 'active' } });
          if (!needsApproval) await tx.club.update({ where: { id }, data: { membersCount: { increment: 1 } } });
        }
        pending = (existing?.status ?? (needsApproval ? 'pending' : 'active')) === 'pending';
      } else {
        const removed = await tx.clubMember.deleteMany({ where: { clubId: id, userId, status: 'active' } });
        if (removed.count > 0) await tx.club.update({ where: { id }, data: { membersCount: { decrement: 1 } } });
        else await tx.clubMember.deleteMany({ where: { clubId: id, userId, status: 'pending' } }); // скасувати заявку
      }
      const fresh = await tx.club.findUnique({ where: { id }, select: { membersCount: true } });
      return Math.max(0, fresh?.membersCount ?? 0);
    });
    if (join && pending) {
      try {
        await prisma.notification.create({ data: { userId: club.ownerId, type: 'club_join_request', title: 'Нова заявка на вступ', message: club.name.slice(0, 150), relatedUserId: userId, relatedEntityType: 'club', relatedEntityId: id } }); // i18n-ignore
      } catch { /* сповіщення необов'язкове */ }
    }
    return NextResponse.json({ success: true, joined: join && !pending, pending: join && pending, membersCount });
  } catch (error) {
    console.error('Club membership error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return setMembership(request, params.id, true);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return setMembership(request, params.id, false);
}
