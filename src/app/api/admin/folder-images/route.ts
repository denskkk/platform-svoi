/**
 * PUT /api/admin/folder-images { project, path, imageUrl }
 * Зберігає картинку папки; порожній imageUrl прибирає її. Лише адміністратор.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { findFolder } from '@/lib/projectFolders';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  const t = getApiT(request);
  try {
    const userId = (request as any).user?.userId;
    const me = userId ? await prisma.user.findUnique({ where: { id: Number(userId) }, select: { isAdmin: true } }) : null;
    if (!me?.isAdmin) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const project = typeof body.project === 'string' ? body.project : '';
    const path = typeof body.path === 'string' ? body.path : '';
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    if (!findFolder(project, path)) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    // Лише наші завантаження (/uploads/...) або https-адреса
    if (imageUrl && (imageUrl.length > 255 || !(/^\/uploads\/[\w./-]+$/.test(imageUrl) || /^https:\/\/\S+$/.test(imageUrl)))) {
      return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    }

    if (!imageUrl) {
      await prisma.folderImage.deleteMany({ where: { project, path } });
    } else {
      await prisma.folderImage.upsert({
        where: { project_path: { project, path } },
        create: { project, path, imageUrl },
        update: { imageUrl },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Folder image error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return withAuth(request, handler);
}
