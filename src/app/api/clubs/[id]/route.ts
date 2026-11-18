/**
 * GET    /api/clubs/:id — клуб + перші учасники
 * DELETE /api/clubs/:id — видалити (творець або адміністратор)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { isBlockedBetween } from '@/lib/blocks';
import { parseId } from '@/lib/feed';
import { serializeClub } from '@/lib/clubs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);
    const id = parseId(params.id);
    const club = id ? await prisma.club.findFirst({ where: { id, isHidden: false } }) : null;
    if (!club || (club.ownerId !== userId && (await isBlockedBetween(userId, club.ownerId)))) {
      return NextResponse.json({ error: t('api.clubs.notFound') }, { status: 404 });
    }
    const [members, mine] = await Promise.all([
      prisma.clubMember.findMany({
        where: { clubId: club.id, user: { isActive: true } },
        orderBy: { id: 'asc' },
        take: 30,
        select: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, businessInfo: { select: { companyName: true, logoUrl: true } } } } },
      }),
      prisma.clubMember.findUnique({ where: { clubId_userId: { clubId: club.id, userId } }, select: { id: true } }),
    ]);
    return NextResponse.json({
      club: { ...serializeClub(club, !!mine, userId), ownerId: club.ownerId },
      members: members.map((m: any) => ({
        id: m.user.id,
        name: m.user.businessInfo?.companyName || `${m.user.firstName} ${m.user.lastName}`.trim(),
        avatarUrl: m.user.businessInfo?.logoUrl || m.user.avatarUrl,
      })),
    });
  } catch (error) {
    console.error('Club detail error:', error);
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
    const club = id ? await prisma.club.findUnique({ where: { id }, select: { ownerId: true } }) : null;
    if (!id || !club) return NextResponse.json({ error: t('api.clubs.notFound') }, { status: 404 });
    if (club.ownerId !== userId) {
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
      if (!me?.isAdmin) return NextResponse.json({ error: t('api.feed.forbidden') }, { status: 403 });
    }
    await prisma.club.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete club error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
