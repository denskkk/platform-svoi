/**
 * GET    /api/videos/:id — статус обробки власного відео { status, url?, posterUrl?, durationSec?, error? }
 * DELETE /api/videos/:id — прибрати власне відео, яке ще не прикріплене до допису
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';
import { kickVideoWorker, removeVideoFiles } from '@/lib/videos';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);
    const id = parseId(params.id);
    const v = id ? await prisma.postVideo.findFirst({ where: { id, ownerId: userId } }) : null;
    if (!v) return NextResponse.json({ error: t('api.videos.notFound') }, { status: 404 });
    if (v.status === 'queued') kickVideoWorker(); // якщо сервер перезапускався — чергу підхоплюємо
    return NextResponse.json({ video: { id: v.id, status: v.status, url: v.url, posterUrl: v.posterUrl, durationSec: v.durationSec, error: v.error } });
  } catch (error) {
    console.error('Video status error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);
    const id = parseId(params.id);
    const v = id ? await prisma.postVideo.findFirst({ where: { id, ownerId: userId, postId: null } }) : null;
    if (!v) return NextResponse.json({ error: t('api.videos.notFound') }, { status: 404 });
    await removeVideoFiles(v);
    await prisma.postVideo.delete({ where: { id: v.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Video delete error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
