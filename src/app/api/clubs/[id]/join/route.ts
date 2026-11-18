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
    const club = id ? await prisma.club.findFirst({ where: { id, isHidden: false }, select: { id: true, ownerId: true } }) : null;
    if (!id || !club) return NextResponse.json({ error: t('api.clubs.notFound') }, { status: 404 });
    if (join && (await isBlockedBetween(userId, club.ownerId))) return NextResponse.json({ error: t('api.feed.blocked') }, { status: 403 });
    if (!join && club.ownerId === userId) return NextResponse.json({ error: t('api.clubs.ownerCannotLeave') }, { status: 400 });

    const membersCount = await prisma.$transaction(async (tx: any) => {
      if (join) {
        const created = await tx.clubMember.createMany({ data: [{ clubId: id, userId }], skipDuplicates: true });
        if (created.count > 0) await tx.club.update({ where: { id }, data: { membersCount: { increment: 1 } } });
      } else {
        const removed = await tx.clubMember.deleteMany({ where: { clubId: id, userId } });
        if (removed.count > 0) await tx.club.update({ where: { id }, data: { membersCount: { decrement: 1 } } });
      }
      const fresh = await tx.club.findUnique({ where: { id }, select: { membersCount: true } });
      return Math.max(0, fresh?.membersCount ?? 0);
    });
    return NextResponse.json({ success: true, joined: join, membersCount });
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
