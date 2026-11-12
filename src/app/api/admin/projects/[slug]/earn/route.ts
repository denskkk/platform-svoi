/**
 * GET/PUT /api/admin/projects/:slug/earn — редагування сторінки «Як заробити з нами?» (лише адміністратор).
 * Текст — звичайний (без HTML), відображається як є.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { getProject } from '@/lib/projects';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const LIMITS = { titleUk: 150, titleEn: 150, bodyUk: 8000, bodyEn: 8000 } as const;

async function handler(request: NextRequest, slug: string) {
  const t = getApiT(request);
  try {
    const adminId = Number((request as any).user?.userId);
    const me = adminId ? await prisma.user.findUnique({ where: { id: adminId }, select: { isAdmin: true } }) : null;
    if (!me?.isAdmin) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });
    if (!(await getProject(slug))) return NextResponse.json({ error: t('api.projects.notFound') }, { status: 404 });

    if (request.method === 'GET') {
      const page = await prisma.projectEarnPage.findUnique({ where: { projectSlug: slug } });
      return NextResponse.json({ page: page ?? { titleUk: '', titleEn: '', bodyUk: '', bodyEn: '' } });
    }

    const body = await request.json().catch(() => ({}));
    const data: Record<string, string> = {};
    for (const [key, max] of Object.entries(LIMITS)) {
      const v = body?.[key];
      if (typeof v !== 'string') return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
      data[key] = v.trim().slice(0, max);
    }
    const page = await prisma.projectEarnPage.upsert({
      where: { projectSlug: slug },
      create: { projectSlug: slug, ...data, updatedById: adminId },
      update: { ...data, updatedById: adminId },
    });
    await logAudit({ actorId: adminId, action: 'earn_page.update', entityType: 'project', details: { slug } });
    return NextResponse.json({ page });
  } catch (error) {
    console.error('Admin earn page error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return withAuth(request, (req) => handler(req, params.slug));
}
export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
  return withAuth(request, (req) => handler(req, params.slug));
}
