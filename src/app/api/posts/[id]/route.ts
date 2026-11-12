/**
 * GET    /api/posts/:id — один допис
 * PATCH  /api/posts/:id { content } — змінити текст (лише автор)
 * DELETE /api/posts/:id — видалити допис (автор або адміністратор)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAuthWithPermission } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { isBlockedBetween } from '@/lib/blocks';
import { FEED_LIMITS, loadViewerState, parseId, postInclude, removePostImageFiles, serializePost } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'VIEW_FEED');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const postId = parseId(params.id);
    const post = postId
      ? await prisma.post.findFirst({ where: { id: postId, isHidden: false, author: { isActive: true } }, include: postInclude })
      : null;
    if (!post || (await isBlockedBetween(userId, post.authorId))) {
      return NextResponse.json({ error: t('api.feed.postNotFound') }, { status: 404 });
    }

    const state = await loadViewerState(userId, [post.id], [post.authorId]);
    return NextResponse.json({ post: serializePost(post, state) });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'CREATE_POST');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const postId = parseId(params.id);
    const existing = postId
      ? await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, images: { select: { id: true } } } })
      : null;
    if (!postId || !existing) return NextResponse.json({ error: t('api.feed.postNotFound') }, { status: 404 });
    if (existing.authorId !== userId) return NextResponse.json({ error: t('api.feed.forbidden') }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content && existing.images.length === 0) {
      return NextResponse.json({ error: t('api.feed.emptyPost') }, { status: 400 });
    }
    if (content.length > FEED_LIMITS.postMaxLength) {
      return NextResponse.json({ error: t('api.feed.postTooLong', { max: FEED_LIMITS.postMaxLength }) }, { status: 400 });
    }

    const post = await prisma.post.update({ where: { id: postId }, data: { content }, include: postInclude });
    const state = await loadViewerState(userId, [post.id], [userId]);
    return NextResponse.json({ success: true, post: serializePost(post, state) });
  } catch (error) {
    console.error('Update post error:', error);
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
    if (!postId) return NextResponse.json({ error: t('api.feed.postNotFound') }, { status: 404 });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, images: { select: { url: true } } },
    });
    if (!post) return NextResponse.json({ error: t('api.feed.postNotFound') }, { status: 404 });

    if (post.authorId !== userId) {
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
      if (!me?.isAdmin) return NextResponse.json({ error: t('api.feed.forbidden') }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: postId } });
    await removePostImageFiles(post.images.map((i: any) => i.url));
    return NextResponse.json({ success: true, message: t('api.feed.postDeleted') });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
