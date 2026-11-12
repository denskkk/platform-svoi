/**
 * GET    /api/blocks              — користувачі, яких заблокував поточний користувач
 * POST   /api/blocks { userId }   — заблокувати (також скасовує підписки в обидва боки)
 * DELETE /api/blocks?userId=ID    — розблокувати
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const blockerId = Number(auth.user.userId);

    const rows = await prisma.userBlock.findMany({
      where: { blockerId },
      orderBy: { id: 'desc' },
      take: 200,
      include: {
        blocked: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, businessInfo: { select: { companyName: true, logoUrl: true } } },
        },
      },
    });

    return NextResponse.json({
      blocks: rows.map((r) => ({
        userId: r.blocked.id,
        name: r.blocked.businessInfo?.companyName || `${r.blocked.firstName} ${r.blocked.lastName}`.trim(),
        avatarUrl: r.blocked.businessInfo?.logoUrl || r.blocked.avatarUrl,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get blocks error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const blockerId = Number(auth.user.userId);

    const limit = checkRateLimit(`block:${blockerId}`, { interval: 60 * 60 * 1000, maxRequests: 100 });
    if (!limit.allowed) return NextResponse.json({ error: t('api.feed.tooManyActions') }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const blockedId = parseId(body?.userId);
    if (!blockedId) return NextResponse.json({ error: t('api.common.specifyUser') }, { status: 400 });
    if (blockedId === blockerId) return NextResponse.json({ error: t('api.feed.blockSelf') }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
    if (!target) return NextResponse.json({ error: t('api.common.userNotFound') }, { status: 404 });

    await prisma.$transaction([
      prisma.userBlock.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        create: { blockerId, blockedId },
        update: {},
      }),
      prisma.follow.deleteMany({
        where: { OR: [{ followerId: blockerId, followingId: blockedId }, { followerId: blockedId, followingId: blockerId }] },
      }),
    ]);

    return NextResponse.json({ success: true, blocked: true, message: t('api.feed.userBlocked') }, { status: 201 });
  } catch (error) {
    console.error('Block user error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const blockerId = Number(auth.user.userId);

    const blockedId = parseId(new URL(request.url).searchParams.get('userId'));
    if (!blockedId) return NextResponse.json({ error: t('api.common.specifyUser') }, { status: 400 });

    await prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
    return NextResponse.json({ success: true, blocked: false, message: t('api.feed.userUnblocked') });
  } catch (error) {
    console.error('Unblock user error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
