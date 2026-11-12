/**
 * GET    /api/follows?userId=ID    — чи підписаний поточний користувач { following }
 * POST   /api/follows { userId }   — підписатися
 * DELETE /api/follows?userId=ID    — відписатися
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'VIEW_FEED');
    if (auth.error) return auth.error;
    const followerId = Number(auth.user.userId);

    const followingId = parseId(new URL(request.url).searchParams.get('userId'));
    if (!followingId) return NextResponse.json({ error: t('api.common.specifyUser') }, { status: 400 });

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
      select: { id: true },
    });
    return NextResponse.json({ following: !!existing });
  } catch (error) {
    console.error('Get follow error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'FOLLOW_USER');
    if (auth.error) return auth.error;
    const followerId = Number(auth.user.userId);

    const limit = checkRateLimit(`follow:${followerId}`, { interval: 60 * 60 * 1000, maxRequests: 200 });
    if (!limit.allowed) return NextResponse.json({ error: t('api.feed.tooManyActions') }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const followingId = parseId(body?.userId);
    if (!followingId) return NextResponse.json({ error: t('api.common.specifyUser') }, { status: 400 });
    if (followingId === followerId) return NextResponse.json({ error: t('api.feed.selfFollow') }, { status: 400 });

    const target = await prisma.user.findFirst({ where: { id: followingId, isActive: true }, select: { id: true } });
    if (!target) return NextResponse.json({ error: t('api.common.userNotFound') }, { status: 404 });

    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
    return NextResponse.json({ success: true, following: true, message: t('api.feed.followed') }, { status: 201 });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'FOLLOW_USER');
    if (auth.error) return auth.error;
    const followerId = Number(auth.user.userId);

    const followingId = parseId(new URL(request.url).searchParams.get('userId'));
    if (!followingId) return NextResponse.json({ error: t('api.common.specifyUser') }, { status: 400 });

    await prisma.follow.deleteMany({ where: { followerId, followingId } });
    return NextResponse.json({ success: true, following: false, message: t('api.feed.unfollowed') });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
