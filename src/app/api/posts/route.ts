/**
 * POST /api/posts { content, media?: ({type:'image',url}|{type:'video',id})[] } — створити допис (фото й відео в одній каруселі)
 *  Сумісність: images?: string[] і videoId.
 *  Фото попередньо завантажуються через /api/upload (type=posts).
 */

import { getClubAccess } from '@/lib/clubAccess';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { getApiT } from '@/i18n/server';
import { FEED_LIMITS, isOwnPostImage, loadViewerState, postInclude, serializePost } from '@/lib/feed';

export const dynamic = 'force-dynamic';

/** Недавні requestId → id допису (один процес PM2; захист від дублів при повторі) */
const RECENT_REQUESTS = new Map<string, { postId: number; at: number }>();

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'CREATE_POST');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const limit = checkRateLimit(`post:create:${userId}`, { interval: 60 * 60 * 1000, maxRequests: 30 });
    if (!limit.allowed) {
      return NextResponse.json({ error: t('api.feed.tooManyPosts') }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    // Карусель: body.media = [{type:'image',url},{type:'video',id}] у порядку показу (фото й відео разом).
    // Старий формат (images[] + videoId) теж працює: відео йде першим.
    type Raw = { type?: string; url?: unknown; id?: unknown };
    let raw: Raw[] = Array.isArray(body?.media) ? body.media : [];
    if (raw.length === 0) {
      if (body?.videoId) raw.push({ type: 'video', id: body.videoId });
      if (Array.isArray(body?.images)) for (const url of body.images) raw.push({ type: 'image', url });
    }
    if (raw.length > FEED_LIMITS.maxMedia) {
      return NextResponse.json({ error: t('api.feed.tooManyMedia', { max: FEED_LIMITS.maxMedia }) }, { status: 400 });
    }
    const images: { url: string; position: number }[] = [];
    const videoIds: { id: number; position: number }[] = [];
    raw.forEach((m, position) => {
      if (m?.type === 'video') videoIds.push({ id: Number(m.id), position });
      else images.push({ url: String(m?.url ?? ''), position });
    });
    if (images.length > FEED_LIMITS.maxImages) {
      return NextResponse.json({ error: t('api.feed.tooManyImages', { max: FEED_LIMITS.maxImages }) }, { status: 400 });
    }
    if (videoIds.length > FEED_LIMITS.maxVideos) {
      return NextResponse.json({ error: t('api.feed.tooManyVideos', { max: FEED_LIMITS.maxVideos }) }, { status: 400 });
    }
    if (!images.every((i) => isOwnPostImage(i.url))) {
      return NextResponse.json({ error: t('api.feed.invalidImage') }, { status: 400 });
    }
    let videos: { id: number; position: number }[] = [];
    if (videoIds.length) {
      const ids = videoIds.map((v) => v.id);
      if (ids.some((id) => !Number.isInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
        return NextResponse.json({ error: t('api.videos.notReady') }, { status: 400 });
      }
      const found = await prisma.postVideo.findMany({ where: { id: { in: ids }, ownerId: userId, postId: null, status: 'ready' }, select: { id: true } });
      if (found.length !== ids.length) return NextResponse.json({ error: t('api.videos.notReady') }, { status: 400 });
      videos = videoIds;
    }

    // Допис на дошці спільноти: писати може власник або учасник із правом писати
    let clubId: number | null = null;
    if (body?.clubId) {
      const cid = Number(body.clubId);
      const access = Number.isInteger(cid) && cid > 0 ? await getClubAccess(cid, userId) : null;
      if (!access) return NextResponse.json({ error: t('api.clubs.notFound') }, { status: 404 });
      if (!access.canPost) return NextResponse.json({ error: t('api.clubs.cannotPost') }, { status: 403 });
      clubId = cid;
    }

    if (!content && images.length === 0 && videos.length === 0) {
      return NextResponse.json({ error: t('api.feed.emptyPost') }, { status: 400 });
    }
    if (content.length > FEED_LIMITS.postMaxLength) {
      return NextResponse.json({ error: t('api.feed.postTooLong', { max: FEED_LIMITS.postMaxLength }) }, { status: 400 });
    }

    // Повторне надсилання того самого запиту (обрив мережі, повторний тап) не створює дубль допису
    const requestId = typeof body?.requestId === 'string' && body.requestId ? `${userId}:${body.requestId.slice(0, 64)}` : null;
    if (requestId) {
      const seen = RECENT_REQUESTS.get(requestId);
      if (seen && Date.now() - seen.at < 15 * 60_000) {
        const existing = await prisma.post.findUnique({ where: { id: seen.postId }, include: postInclude });
        if (existing) {
          existing.videos = await prisma.postVideo.findMany({ where: { postId: existing.id }, orderBy: [{ position: 'asc' }, { id: 'asc' }], select: { id: true, status: true, url: true, posterUrl: true, durationSec: true, position: true } });
          const st = await loadViewerState(userId, [existing.id], [userId]);
          return NextResponse.json({ success: true, post: serializePost(existing, st), message: t('api.feed.postCreated') }, { status: 200 });
        }
      }
    }

    // Допис і прив’язка відео — в одній транзакції: або все, або нічого (інакше помилка після створення давала дублі при повторі)
    const post = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.post.create({
        data: {
          authorId: userId,
          clubId,
          content,
          images: { create: images },
        },
        include: postInclude,
      });
      for (const v of videos) await tx.postVideo.update({ where: { id: v.id }, data: { postId: created.id, position: v.position } });
      return created;
    });
    if (requestId) {
      RECENT_REQUESTS.set(requestId, { postId: post.id, at: Date.now() });
      if (RECENT_REQUESTS.size > 500) Array.from(RECENT_REQUESTS.entries()).forEach(([k, v]) => { if (Date.now() - v.at > 15 * 60_000) RECENT_REQUESTS.delete(k); });
    }
    if (videos.length) {
      post.videos = await prisma.postVideo.findMany({ where: { postId: post.id }, orderBy: [{ position: 'asc' }, { id: 'asc' }], select: { id: true, status: true, url: true, posterUrl: true, durationSec: true, position: true } });
    }

    const state = await loadViewerState(userId, [post.id], [userId]);
    return NextResponse.json(
      { success: true, post: serializePost(post, state), message: t('api.feed.postCreated') },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
