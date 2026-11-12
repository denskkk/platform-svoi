/**
 * POST /api/posts { content, images?: string[] } — створити допис
 *  Фото попередньо завантажуються через /api/upload (type=posts).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { getApiT } from '@/i18n/server';
import { FEED_LIMITS, isOwnPostImage, loadViewerState, postInclude, serializePost } from '@/lib/feed';

export const dynamic = 'force-dynamic';

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
    const images: unknown[] = Array.isArray(body?.images) ? body.images : [];

    if (!content && images.length === 0) {
      return NextResponse.json({ error: t('api.feed.emptyPost') }, { status: 400 });
    }
    if (content.length > FEED_LIMITS.postMaxLength) {
      return NextResponse.json({ error: t('api.feed.postTooLong', { max: FEED_LIMITS.postMaxLength }) }, { status: 400 });
    }
    if (images.length > FEED_LIMITS.maxImages) {
      return NextResponse.json({ error: t('api.feed.tooManyImages', { max: FEED_LIMITS.maxImages }) }, { status: 400 });
    }
    if (!images.every(isOwnPostImage)) {
      return NextResponse.json({ error: t('api.feed.invalidImage') }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        content,
        images: { create: (images as string[]).map((url, position) => ({ url, position })) },
      },
      include: postInclude,
    });

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
