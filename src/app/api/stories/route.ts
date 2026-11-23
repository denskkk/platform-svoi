/**
 * GET  /api/stories — активні історії (24 год) власні, підписок та інших людей (крім заблокованих і закритих акаунтів).
 *      Відповідь: { groups: [{ author, hasUnseen, stories: [{ id, mediaType, mediaUrl, posterUrl, caption, createdAt, seen, viewsCount? }] }] }
 * POST /api/stories { imageUrl } | { videoId } + caption? — створити історію (фото з /api/upload type=posts або готове відео).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAuthWithPermission } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { getApiT } from '@/i18n/server';
import { getBlockedIds } from '@/lib/blocks';
import { getPrivateAuthorIdsHiddenFrom } from '@/lib/userSettings';
import { authorSelect, isOwnPostImage } from '@/lib/feed';
import { purgeExpiredStories, STORY_CAPTION_MAX, STORY_TTL_MS } from '@/lib/stories';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);
    purgeExpiredStories();

    // Історії всіх (як у TikTok/Instagram): власні, підписки та інші люди; заблоковані й закриті акаунти (без підписки) приховані
    const [follows, blocked, privateHidden] = await Promise.all([
      prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
      getBlockedIds(userId),
      getPrivateAuthorIdsHiddenFrom(userId),
    ]);
    const followed = new Set<number>(follows.map((f: any) => f.followingId));
    const hidden = [...blocked, ...privateHidden].filter((id: number) => id !== userId);
    const rows = await prisma.story.findMany({
      where: { expiresAt: { gt: new Date() }, owner: { isActive: true }, ...(hidden.length ? { ownerId: { notIn: hidden } } : {}) },
      orderBy: { id: 'asc' },
      take: 300,
      include: { owner: { select: authorSelect }, views: { where: { userId }, select: { id: true } } },
    });

    const map = new Map<number, any>();
    for (const s of rows as any[]) {
      const o = s.owner;
      let g = map.get(o.id);
      if (!g) {
        g = { followed: followed.has(o.id), author: { id: o.id, name: o.businessInfo?.companyName || `${o.firstName} ${o.lastName}`.trim(), avatarUrl: o.businessInfo?.logoUrl || o.avatarUrl, isVerified: o.isVerified, isOwn: o.id === userId }, hasUnseen: false, stories: [] };
        map.set(o.id, g);
      }
      const seen = s.ownerId === userId || s.views.length > 0;
      if (!seen) g.hasUnseen = true;
      g.stories.push({ id: s.id, mediaType: s.mediaType, mediaUrl: s.mediaUrl, posterUrl: s.posterUrl, caption: s.caption, createdAt: s.createdAt, seen, viewsCount: s.ownerId === userId ? s.viewsCount : undefined });
    }
    // власні — першими, далі непереглянуті від тих, на кого підписані, потім інші непереглянуті, потім переглянуті
    const groups = Array.from(map.values())
      .sort((a, b) => Number(b.author.isOwn) - Number(a.author.isOwn) || Number(b.hasUnseen) - Number(a.hasUnseen) || Number(b.followed) - Number(a.followed))
      .slice(0, 40)
      .map(({ followed: _f, ...g }: any) => g);
    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Stories list error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'CREATE_POST');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    if (!checkRateLimit(`story:create:${userId}`, { interval: 24 * 60 * 60 * 1000, maxRequests: 20 }).allowed) {
      return NextResponse.json({ error: t('api.stories.tooMany') }, { status: 429 });
    }
    const body = await request.json().catch(() => ({}));
    const caption = typeof body?.caption === 'string' ? body.caption.trim().slice(0, STORY_CAPTION_MAX) : '';
    const expiresAt = new Date(Date.now() + STORY_TTL_MS);

    if (body?.videoId) {
      const video = await prisma.postVideo.findFirst({ where: { id: Number(body.videoId), ownerId: userId, postId: null, story: null, status: 'ready' } });
      if (!video?.url) return NextResponse.json({ error: t('api.videos.notReady') }, { status: 400 });
      const story = await prisma.story.create({ data: { ownerId: userId, mediaType: 'video', mediaUrl: video.url, posterUrl: video.posterUrl, videoId: video.id, caption: caption || null, expiresAt } });
      return NextResponse.json({ success: true, id: story.id }, { status: 201 });
    }
    if (!isOwnPostImage(body?.imageUrl)) return NextResponse.json({ error: t('api.stories.mediaRequired') }, { status: 400 });
    const story = await prisma.story.create({ data: { ownerId: userId, mediaType: 'image', mediaUrl: body.imageUrl, caption: caption || null, expiresAt } });
    return NextResponse.json({ success: true, id: story.id }, { status: 201 });
  } catch (error) {
    console.error('Story create error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
