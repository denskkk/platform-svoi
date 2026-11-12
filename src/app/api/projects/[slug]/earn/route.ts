/** GET /api/projects/:slug/earn — вміст сторінки «Як заробити з нами?» + моя заявка (якщо авторизований) */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiT } from '@/i18n/server';
import { getProject } from '@/lib/projects';
import { requireAuth } from '@/lib/api-middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const t = getApiT(request);
  try {
    const project = await getProject(params.slug);
    if (!project || project.status === 'hidden') return NextResponse.json({ error: t('api.projects.notFound') }, { status: 404 });

    let page: { titleUk: string; titleEn: string; bodyUk: string; bodyEn: string } | null = null;
    try {
      page = await prisma.projectEarnPage.findUnique({ where: { projectSlug: params.slug } });
    } catch {
      page = null; // таблиця ще не створена — показуємо типовий текст
    }

    let application: { id: number; status: string; rejectReason: string | null; createdAt: Date } | null = null;
    try {
      const auth = await requireAuth(request);
      if (!auth.error && auth.user?.userId) {
        application = await prisma.partnerApplication.findFirst({
          where: { userId: Number(auth.user.userId), projectSlug: params.slug },
          orderBy: { id: 'desc' },
          select: { id: true, status: true, rejectReason: true, createdAt: true },
        });
      }
    } catch { /* гість */ }

    return NextResponse.json({
      project: { slug: project.slug, status: project.status },
      page: page ? { titleUk: page.titleUk, titleEn: page.titleEn, bodyUk: page.bodyUk, bodyEn: page.bodyEn } : null,
      application,
    });
  } catch (error) {
    console.error('Get earn page error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
