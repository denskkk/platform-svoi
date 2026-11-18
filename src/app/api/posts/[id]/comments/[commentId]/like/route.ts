/**
 * POST   /api/posts/:id/comments/:commentId/like — лайкнути коментар
 * DELETE /api/posts/:id/comments/:commentId/like — прибрати лайк
 * Відповідь: { liked, likesCount }. Ідемпотентно.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';
import { isBlockedBetween } from '@/lib/blocks';

export const dynamic = 'force-dynamic';

async function setLike(request: NextRequest, params: { id: string; commentId: string }, like: boolean) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'INTERACT_POST');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const limit = checkRateLimit(`comment:like:${userId}`, { interval: 60 * 1000, maxRequests: 120 });
    if (!limit.allowed) return NextResponse.json({ error: t('api.feed.tooManyActions') }, { status: 429 });

    const postId = parseId(params.id);
    const commentId = parseId(params.commentId);
    const comment = postId && commentId
      ? await prisma.postComment.findFirst({ where: { id: commentId, postId, post: { isHidden: false } }, select: { authorId: true } })
      : null;
    if (!postId || !commentId || !comment) console.warn('[comment-like] not found', { params, postId, commentId, found: !!comment });
    if (!postId || !commentId || !comment) return NextResponse.json({ error: t('api.feed.commentNotFound') }, { status: 404 });
    if (comment.authorId !== userId && (await isBlockedBetween(userId, comment.authorId))) {
      return NextResponse.json({ error: t('api.feed.blocked') }, { status: 403 });
    }

    const likesCount = await prisma.$transaction(async (tx: any) => {
      if (like) {
        const created = await tx.postCommentLike.createMany({ data: [{ commentId, userId }], skipDuplicates: true });
        if (created.count > 0) await tx.postComment.update({ where: { id: commentId }, data: { likesCount: { increment: 1 } } });
      } else {
        const removed = await tx.postCommentLike.deleteMany({ where: { commentId, userId } });
        if (removed.count > 0) await tx.postComment.update({ where: { id: commentId }, data: { likesCount: { decrement: 1 } } });
      }
      const fresh = await tx.postComment.findUnique({ where: { id: commentId }, select: { likesCount: true } });
      return Math.max(0, fresh?.likesCount ?? 0);
    });

    return NextResponse.json({ success: true, liked: like, likesCount });
  } catch (error) {
    console.error('Comment like error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string; commentId: string } }) {
  return setLike(request, params, true);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; commentId: string } }) {
  return setLike(request, params, false);
}
