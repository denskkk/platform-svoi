/** DELETE /api/stories/:id — видалити власну історію (або адміністратором). */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { parseId, removePostImageFiles } from '@/lib/feed';
import { removeVideoFiles } from '@/lib/videos';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);
    const id = parseId(params.id);
    const story = id ? await prisma.story.findUnique({ where: { id }, include: { video: { select: { id: true, rawName: true, url: true, posterUrl: true } } } }) : null;
    if (!story) return NextResponse.json({ error: t('api.stories.notFound') }, { status: 404 });
    if (story.ownerId !== userId) {
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
      if (!me?.isAdmin) return NextResponse.json({ error: t('api.feed.forbidden') }, { status: 403 });
    }
    await prisma.story.delete({ where: { id: story.id } });
    if (story.video) { await removeVideoFiles(story.video); await prisma.postVideo.delete({ where: { id: story.video.id } }).catch(() => undefined); }
    else if (story.mediaType === 'image') await removePostImageFiles([story.mediaUrl]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Story delete error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
