/**
 * PATCH /api/admin/projects/:slug { status?, sortOrder?, nameUk?, nameEn?, descriptionUk?, descriptionEn?, icon?, color?, bannerUrl? }
 * Створює запис зі стартового списку, якщо його ще немає в таблиці. Лише адміністратор.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { DEFAULT_PROJECTS, PROJECT_STATUSES } from '@/lib/projects';

export const dynamic = 'force-dynamic';

const TEXT_LIMITS: Record<string, number> = {
  nameUk: 120, nameEn: 120, descriptionUk: 1000, descriptionEn: 1000, icon: 16, color: 16, bannerUrl: 255,
};

async function handler(request: NextRequest, slug: string) {
  const t = getApiT(request);
  try {
    const userId = (request as any).user?.userId;
    const me = userId ? await prisma.user.findUnique({ where: { id: Number(userId) }, select: { isAdmin: true } }) : null;
    if (!me?.isAdmin) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const data: Record<string, string | number> = {};

    if (body.status !== undefined) {
      if (!(PROJECT_STATUSES as string[]).includes(body.status)) {
        return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body.sortOrder !== undefined) {
      const n = Number(body.sortOrder);
      if (!Number.isInteger(n) || n < 0 || n > 100000) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      data.sortOrder = n;
    }
    for (const [key, max] of Object.entries(TEXT_LIMITS)) {
      if (body[key] === undefined) continue;
      if (typeof body[key] !== 'string' || body[key].length > max) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      if ((key === 'nameUk' || key === 'nameEn') && !body[key].trim()) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      data[key] = body[key].trim();
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });

    const existing = await prisma.project.findUnique({ where: { slug }, select: { id: true } });
    if (existing) {
      await prisma.project.update({ where: { slug }, data });
    } else {
      const base = DEFAULT_PROJECTS.find((p) => p.slug === slug);
      if (!base) return NextResponse.json({ error: t('api.projects.notFound') }, { status: 404 });
      await prisma.project.create({ data: { ...base, ...data, bannerUrl: (data.bannerUrl as string) ?? base.bannerUrl } as any });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  return withAuth(request, (req) => handler(req, params.slug));
}
