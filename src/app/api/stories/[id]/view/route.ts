/** POST /api/stories/:id/view — відмітити перегляд історії (одна відмітка на користувача). */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);
    const id = parseId(params.id);
    const story = id ? await prisma.story.findFirst({ where: { id, expiresAt: { gt: new Date() } }, select: { id: true, ownerId: true } }) : null;
    if (!story) return NextResponse.json({ error: t('api.stories.notFound') }, { status: 404 });
    if (story.ownerId === userId) return NextResponse.json({ success: true });
    try {
      await prisma.storyView.create({ data: { storyId: story.id, userId } });
      await prisma.story.update({ where: { id: story.id }, data: { viewsCount: { increment: 1 } } });
    } catch { /* уже переглянуто */ }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Story view error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
