/**
 * POST   /api/posts/:id/like — поставити лайк
 * DELETE /api/posts/:id/like — прибрати лайк
 * Відповідь: { liked, likesCount }. Операції ідемпотентні.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';
import { notifyFeed } from '@/lib/notify';

export const dynamic = 'force-dynamic';

async function setLike(request: NextRequest, idParam: string, like: boolean) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'INTERACT_POST');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const limit = checkRateLimit(`post:like:${userId}`, { interval: 60 * 1000, maxRequests: 120 });
    if (!limit.allowed) return NextResponse.json({ error: t('api.feed.tooManyActions') }, { status: 429 });

    const postId = parseId(idParam);
    const post = postId
      ? await prisma.post.findFirst({ where: { id: postId, isHidden: false }, select: { id: true, authorId: true } })
      : null;
    if (!postId || !post) return NextResponse.json({ error: t('api.feed.postNotFound') }, { status: 404 });

    let newLike = false;
    const likesCount = await prisma.$transaction(async (tx) => {
      if (like) {
        const created = await tx.postLike.createMany({ data: [{ postId, userId }], skipDuplicates: true });
        if (created.count > 0) {
          newLike = true;
          await tx.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });
        }
      } else {
        const removed = await tx.postLike.deleteMany({ where: { postId, userId } });
        if (removed.count > 0) await tx.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
      }
      const fresh = await tx.post.findUnique({ where: { id: postId }, select: { likesCount: true } });
      return Math.max(0, fresh?.likesCount ?? 0);
    });

    if (newLike) await notifyFeed({ type: 'post_like', recipientId: post.authorId, actorId: userId, postId });

    return NextResponse.json({ success: true, liked: like, likesCount });
  } catch (error) {
    console.error('Post like error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return setLike(request, params.id, true);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return setLike(request, params.id, false);
}
