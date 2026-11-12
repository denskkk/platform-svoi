/**
 * GET  /api/business-applications — мої заявки бізнесу
 * POST /api/business-applications — подати заявку (одна активна заявка на користувача)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getProject } from '@/lib/projects';

export const dynamic = 'force-dynamic';

function serializeApplication(a: any) {
  return {
    id: a.id,
    companyName: a.companyName,
    activity: a.activity,
    city: a.city,
    contactName: a.contactName,
    phone: a.phone,
    website: a.website,
    description: a.description,
    projectSlug: a.projectSlug,
    status: a.status,
    proposedRewardPercent: a.proposedRewardPercent === null || a.proposedRewardPercent === undefined ? null : Number(a.proposedRewardPercent),
    rejectReason: a.rejectReason,
    createdAt: a.createdAt,
  };
}

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const rows = await prisma.businessApplication.findMany({
      where: { userId: Number(auth.user.userId) },
      orderBy: { id: 'desc' },
      take: 10,
    });
    return NextResponse.json({ applications: rows.map(serializeApplication) });
  } catch (error) {
    console.error('Get business applications error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const limit = checkRateLimit(`bizapp:create:${userId}`, { interval: 24 * 60 * 60 * 1000, maxRequests: 5 });
    if (!limit.allowed) return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const companyName = str(body?.companyName, 150);
    const activity = str(body?.activity, 150);
    const city = str(body?.city, 100);
    const phone = str(body?.phone, 30);
    const description = str(body?.description, 3000);
    const contactName = str(body?.contactName, 100) || null;
    let website = str(body?.website, 255) || null;
    let projectSlug = str(body?.projectSlug, 60) || null;

    if (!companyName || !activity || !city || description.length < 20) {
      return NextResponse.json({ error: t('api.businessApplications.fieldsInvalid') }, { status: 400 });
    }
    if (!/^\+?[0-9 ()-]{7,30}$/.test(phone)) {
      return NextResponse.json({ error: t('api.businessApplications.phoneInvalid') }, { status: 400 });
    }
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    if (website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) {
      return NextResponse.json({ error: t('api.businessApplications.websiteInvalid') }, { status: 400 });
    }
    if (projectSlug && !(await getProject(projectSlug))) projectSlug = null;

    const active = await prisma.businessApplication.findFirst({
      where: { userId, status: { in: ['pending', 'approved'] } },
      select: { id: true },
    });
    if (active) return NextResponse.json({ error: t('api.businessApplications.alreadyExists') }, { status: 409 });

    const created = await prisma.businessApplication.create({
      data: { userId, companyName, activity, city, phone, description, contactName, website, projectSlug },
    });
    return NextResponse.json({ application: serializeApplication(created), message: t('api.businessApplications.submitted') }, { status: 201 });
  } catch (error) {
    console.error('Create business application error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
