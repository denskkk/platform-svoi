/**
 * GET /api/folder-images?project=<slug> → { images: { "<path>": "<url>" } }
 * Картинки папок проєкту (path = a або a.b). Публічно: це лише адреси оформлення.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const project = (new URL(request.url).searchParams.get('project') || '').trim();
  if (!/^[a-z0-9-]{1,60}$/.test(project)) return NextResponse.json({ images: {} });
  try {
    const rows = await prisma.folderImage.findMany({ where: { project }, select: { path: true, imageUrl: true }, take: 500 });
    const images: Record<string, string> = {};
    rows.forEach((r) => { images[r.path] = r.imageUrl; });
    return NextResponse.json({ images }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Таблиця ще не створена або збій: плитки просто без картинок
    return NextResponse.json({ images: {} });
  }
}
