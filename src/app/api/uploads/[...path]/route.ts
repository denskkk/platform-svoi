/**
 * GET /uploads/<dir>/<file>  (через rewrite -> /api/uploads/...)
 * Віддає зображення, завантажені користувачами після збірки застосунку.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import { readFile, stat } from 'fs/promises';
import { Readable } from 'stream';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_DIRS = new Set(['avatars', 'logos', 'services', 'banners', 'misc', 'requests', 'posts', 'listings', 'videos']);
const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
};

function notFound() {
  return new NextResponse('Not found', {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const segments = params.path || [];
  if (segments.length !== 2) return notFound();

  const [dir, file] = segments;
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED_DIRS.has(dir) || !MIME[ext] || !/^[\w.\-]+$/.test(file) || file.includes('..')) {
    return notFound();
  }

  const root = process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads');
  const filePath = path.join(root, dir, file);

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return notFound();
    // Відео віддаємо потоком і з підтримкою Range (перемотування, iOS/Safari), без читання файлу в пам’ять
    if (ext === '.mp4') {
      const size = info.size;
      const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
      let start = 0;
      let end = size - 1;
      let status = 200;
      if (range && (range[1] || range[2])) {
        if (range[1]) { start = Number(range[1]); end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1; }
        else { start = Math.max(0, size - Number(range[2])); }
        if (start > end || start >= size) {
          return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
        }
        status = 206;
      }
      const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as unknown as ReadableStream;
      const headers: Record<string, string> = {
        'Content-Type': MIME[ext],
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      };
      if (status === 206) headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
      return new NextResponse(stream, { status, headers });
    }
    const data = await readFile(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': MIME[ext],
        'Content-Length': String(data.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return notFound();
  }
}
