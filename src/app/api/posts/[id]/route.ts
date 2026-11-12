/**
 * DELETE /api/posts/:id — видалити допис (автор або адміністратор)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const postId = parseId(params.id);
    if (!postId) return NextResponse.json({ error: t('api.feed.postNotFound') }, { status: 404 });

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (!post) return NextResponse.json({ error: t('api.feed.postNotFound') }, { status: 404 });

    if (post.authorId !== userId) {
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
      if (!me?.isAdmin) return NextResponse.json({ error: t('api.feed.forbidden') }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: postId } });
    return NextResponse.json({ success: true, message: t('api.feed.postDeleted') });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
