/**
 * GET /uploads/<dir>/<file>  (через rewrite -> /api/uploads/...)
 * Віддає зображення, завантажені користувачами після збірки застосунку.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_DIRS = new Set(['avatars', 'logos', 'services', 'banners', 'misc', 'requests']);
const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
};

function notFound() {
  return new NextResponse('Not found', {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(_request: NextRequest, { params }: { params: { path: string[] } }) {
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
