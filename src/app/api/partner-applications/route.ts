/** POST /api/partner-applications { projectSlug, phone, message } — заявка на партнерство в напрямку */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getProject } from '@/lib/projects';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const limit = checkRateLimit(`partner:create:${userId}`, { interval: 24 * 60 * 60 * 1000, maxRequests: 10 });
    if (!limit.allowed) return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const slug = typeof body?.projectSlug === 'string' ? body.projectSlug.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim().slice(0, 30) : '';
    const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 2000) : '';

    const project = slug ? await getProject(slug) : null;
    if (!project || project.status === 'hidden') return NextResponse.json({ error: t('api.projects.notFound') }, { status: 404 });
    if (!/^\+?[0-9 ()-]{7,30}$/.test(phone)) return NextResponse.json({ error: t('api.businessApplications.phoneInvalid') }, { status: 400 });
    if (message.length < 10) return NextResponse.json({ error: t('api.partnerApplications.messageInvalid') }, { status: 400 });

    const active = await prisma.partnerApplication.findFirst({
      where: { userId, projectSlug: slug, status: { in: ['pending', 'approved'] } },
      select: { id: true },
    });
    if (active) return NextResponse.json({ error: t('api.businessApplications.alreadyExists') }, { status: 409 });

    await prisma.partnerApplication.create({ data: { userId, projectSlug: slug, phone, message } });
    return NextResponse.json({ message: t('api.businessApplications.submitted') }, { status: 201 });
  } catch (error) {
    console.error('Create partner application error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
