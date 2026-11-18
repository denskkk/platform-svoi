/**
 * POST /api/posts/:id/repost { content? } — поділитися дописом у своїй стрічці (репост із необов’язковим коментарем).
 * Репост репосту веде на оригінал. Автор оригіналу отримує лічильник репостів.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { getApiT } from '@/i18n/server';
import { FEED_LIMITS, loadViewerState, parseId, postInclude, serializePost } from '@/lib/feed';
import { isBlockedBetween } from '@/lib/blocks';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'CREATE_POST');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    if (!checkRateLimit(`post:repost:${userId}`, { interval: 60 * 60 * 1000, maxRequests: 30 }).allowed) {
      return NextResponse.json({ error: t('api.feed.tooManyPosts') }, { status: 429 });
    }
    const id = parseId(params.id);
    const source = id ? await prisma.post.findFirst({ where: { id, isHidden: false, author: { isActive: true } }, select: { id: true, authorId: true, repostOfId: true } }) : null;
    if (!source) return NextResponse.json({ error: t('api.feed.postNotFound') }, { status: 404 });
    if (await isBlockedBetween(userId, source.authorId)) return NextResponse.json({ error: t('api.feed.blocked') }, { status: 403 });

    const originalId = source.repostOfId || source.id;
    const body = await request.json().catch(() => ({}));
    const content = typeof body?.content === 'string' ? body.content.trim().slice(0, FEED_LIMITS.postMaxLength) : '';

    const dup = await prisma.post.findFirst({ where: { authorId: userId, repostOfId: originalId, createdAt: { gt: new Date(Date.now() - 60_000) } }, select: { id: true } });
    if (dup) return NextResponse.json({ error: t('api.feed.tooManyActions') }, { status: 429 });

    const post = await prisma.$transaction(async (tx: any) => {
      const created = await tx.post.create({ data: { authorId: userId, content, repostOfId: originalId }, include: postInclude });
      await tx.post.update({ where: { id: originalId }, data: { repostsCount: { increment: 1 } } });
      return created;
    });
    const state = await loadViewerState(userId, [post.id], [userId]);
    return NextResponse.json({ success: true, post: serializePost(post, state) }, { status: 201 });
  } catch (error) {
    console.error('Repost error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
