/**
 * POST /api/videos/upload — завантаження відео «сирим» тілом запиту (Content-Type: video/mp4 | video/quicktime | video/webm).
 * Файл пишеться потоком на диск (без буферизації в пам’яті), ліміт розміру жорсткий.
 * Відповідь: { video: { id, status: 'queued' } }; далі статус перевіряється через GET /api/videos/:id.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createWriteStream } from 'fs';
import { mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { getApiT } from '@/i18n/server';
import { extForMime, kickVideoWorker, rawDir, VIDEO_LIMITS } from '@/lib/videos';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuthWithPermission(request, 'CREATE_POST');
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    if (!checkRateLimit(`video:upload:${userId}`, { interval: 24 * 60 * 60 * 1000, maxRequests: VIDEO_LIMITS.uploadsPerDay }).allowed) {
      return NextResponse.json({ error: t('api.videos.tooMany') }, { status: 429 });
    }
    const mime = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const ext = extForMime(mime);
    if (!ext) return NextResponse.json({ error: t('api.videos.badType') }, { status: 400 });
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > VIDEO_LIMITS.maxBytes) return NextResponse.json({ error: t('api.videos.tooLarge', { max: Math.round(VIDEO_LIMITS.maxBytes / 1048576) }) }, { status: 413 });
    if (!request.body) return NextResponse.json({ error: t('api.videos.badType') }, { status: 400 });

    // не більше 3 необроблених відео одночасно на користувача
    const pending = await prisma.postVideo.count({ where: { ownerId: userId, status: { in: ['queued', 'processing'] } } });
    if (pending >= 3) return NextResponse.json({ error: t('api.videos.tooMany') }, { status: 429 });

    await mkdir(rawDir(), { recursive: true });
    const created = await prisma.postVideo.create({ data: { ownerId: userId, status: 'uploading' } });
    const rawName = `r${created.id}.${ext}`;
    const target = join(rawDir(), rawName);

    let received = 0;
    const limiter = new TransformLimit(VIDEO_LIMITS.maxBytes, (n) => { received = n; });
    try {
      await pipeline(Readable.fromWeb(request.body as any), limiter, createWriteStream(target));
    } catch (e: any) {
      await unlink(target).catch(() => undefined);
      await prisma.postVideo.delete({ where: { id: created.id } }).catch(() => undefined);
      if (e?.code === 'VIDEO_TOO_LARGE') return NextResponse.json({ error: t('api.videos.tooLarge', { max: Math.round(VIDEO_LIMITS.maxBytes / 1048576) }) }, { status: 413 });
      throw e;
    }
    if (received === 0) {
      await unlink(target).catch(() => undefined);
      await prisma.postVideo.delete({ where: { id: created.id } }).catch(() => undefined);
      return NextResponse.json({ error: t('api.videos.badType') }, { status: 400 });
    }

    await prisma.postVideo.update({ where: { id: created.id }, data: { status: 'queued', rawName, sizeBytes: received } });
    kickVideoWorker();
    return NextResponse.json({ video: { id: created.id, status: 'queued' } }, { status: 201 });
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

import { Transform, TransformCallback } from 'stream';

/** Рахує байти і перериває потік, якщо перевищено ліміт. */
class TransformLimit extends Transform {
  private total = 0;
  constructor(private readonly max: number, private readonly onCount: (n: number) => void) { super(); }
  _transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback) {
    this.total += chunk.length;
    this.onCount(this.total);
    if (this.total > this.max) {
      const err: any = new Error('too large');
      err.code = 'VIDEO_TOO_LARGE';
      return cb(err);
    }
    cb(null, chunk);
  }
}
