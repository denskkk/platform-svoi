/**
 * GET    /api/posts/:id/comments?cursor=<commentId>&limit=20 — коментарі (старіші зверху)
 * POST   /api/posts/:id/comments { content }                 — додати коментар
 * DELETE /api/posts/:id/comments?commentId=ID                — видалити (автор коментаря, автор допису, адмін)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAuthWithPermission } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { getApiT } from '@/i18n/server';
import { authorSelect, FEED_LIMITS, parseId } from '@/lib/feed';
import { getBlockedIds, isBlockedBetween } from '@/lib/blocks';
import { notifyFeed } from '@/lib/notify';

export const dynamic = 'force-dynamic';

function serializeComment(c: any, userId: number) {
  return {
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    isOwn: c.author.id === userId,
    author: {
      id: c.author.id,
      name: c.author.businessInfo?.companyName || `${c.author.firstName} ${c.author.lastName}`.trim(),
      avatarUrl: c.author.businessInfo?.logoUrl || c.author.avatarUrl,
      isVerified: c.author.isVerified,
    },
  };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'VIEW_FEED');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const postId = parseId(params.id);
    const post = postId
      ? await prisma.post.findFirst({ where: { id: postId, isHidden: false }, select: { id: true } })
      : null;
    if (!postId || !post) return NextResponse.json({ error: t('api.feed.postNotFound') }, { status: 404 });

    const search = new URL(request.url).searchParams;
    const cursor = parseId(search.get('cursor'));
    const requested = Number(search.get('limit'));
    const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, 50) : 20;

    const blocked = await getBlockedIds(userId);
    const rows = await prisma.postComment.findMany({
      where: {
        postId,
        author: { isActive: true },
        ...(blocked.length ? { authorId: { notIn: blocked } } : {}),
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      orderBy: { id: 'asc' },
      take: limit + 1,
      include: { author: { select: authorSelect } },
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json({
      comments: page.map((c) => serializeComment(c, userId)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'INTERACT_POST');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const limit = checkRateLimit(`post:comment:${userId}`, { interval: 60 * 60 * 1000, maxRequests: 60 });
    if (!limit.allowed) return NextResponse.json({ error: t('api.feed.tooManyActions') }, { status: 429 });

    const postId = parseId(params.id);
    const post = postId
      ? await prisma.post.findFirst({ where: { id: postId, isHidden: false }, select: { id: true, authorId: true } })
      : null;
    if (!postId || !post) return NextResponse.json({ error: t('api.feed.postNotFound') }, { status: 404 });

    if (await isBlockedBetween(userId, post.authorId)) {
      return NextResponse.json({ error: t('api.feed.blocked') }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content) return NextResponse.json({ error: t('api.feed.commentEmpty') }, { status: 400 });
    if (content.length > FEED_LIMITS.commentMaxLength) {
      return NextResponse.json({ error: t('api.feed.commentTooLong', { max: FEED_LIMITS.commentMaxLength }) }, { status: 400 });
    }

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.postComment.create({
        data: { postId, authorId: userId, content },
        include: { author: { select: authorSelect } },
      });
      await tx.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } });
      return created;
    });

    await notifyFeed({ type: 'post_comment', recipientId: post.authorId, actorId: userId, postId, message: content });

    return NextResponse.json({ success: true, comment: serializeComment(comment, userId) }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const postId = parseId(params.id);
    const commentId = parseId(new URL(request.url).searchParams.get('commentId'));
    const comment = postId && commentId
      ? await prisma.postComment.findFirst({
          where: { id: commentId, postId },
          select: { authorId: true, post: { select: { authorId: true } } },
        })
      : null;
    if (!postId || !commentId || !comment) {
      return NextResponse.json({ error: t('api.feed.commentNotFound') }, { status: 404 });
    }

    if (comment.authorId !== userId && comment.post.authorId !== userId) {
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
      if (!me?.isAdmin) return NextResponse.json({ error: t('api.feed.forbidden') }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      const removed = await tx.postComment.deleteMany({ where: { id: commentId, postId } });
      if (removed.count > 0) await tx.post.update({ where: { id: postId }, data: { commentsCount: { decrement: 1 } } });
    });

    return NextResponse.json({ success: true, message: t('api.feed.commentDeleted') });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
