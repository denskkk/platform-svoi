/**
 * POST   /api/posts/:id/save — додати допис у збережені
 * DELETE /api/posts/:id/save — прибрати зі збережених
 * Відповідь: { saved }. Операції ідемпотентні; закладки приватні.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';
import { isBlockedBetween } from '@/lib/blocks';

export const dynamic = 'force-dynamic';

async function setSaved(request: NextRequest, idParam: string, save: boolean) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'VIEW_FEED');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const limit = checkRateLimit(`post:save:${userId}`, { interval: 60 * 1000, maxRequests: 60 });
    if (!limit.allowed) return NextResponse.json({ error: t('api.common.tooManyRequestsShort') }, { status: 429 });

    const postId = parseId(idParam);
    if (!postId) return NextResponse.json({ error: t('api.feed.postNotFound') }, { status: 404 });

    if (save) {
      const post = await prisma.post.findFirst({ where: { id: postId, isHidden: false, author: { isActive: true } }, select: { authorId: true } });
      if (!post || (await isBlockedBetween(userId, post.authorId))) return NextResponse.json({ error: t('api.feed.postNotFound') }, { status: 404 });
      await prisma.savedPost.createMany({ data: [{ userId, postId }], skipDuplicates: true });
    } else {
      await prisma.savedPost.deleteMany({ where: { userId, postId } });
    }
    return NextResponse.json({ saved: save });
  } catch (error) {
    console.error('Save post error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return setSaved(request, params.id, true);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return setSaved(request, params.id, false);
}
