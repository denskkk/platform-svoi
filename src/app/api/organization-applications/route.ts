/**
 * GET  /api/organization-applications — мої заявки громадської організації
 * POST /api/organization-applications — подати заявку (одна активна заявка на користувача)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

function serialize(a: any) {
  return {
    id: a.id, name: a.name, direction: a.direction, description: a.description, country: a.country, city: a.city,
    phone: a.phone, email: a.email, website: a.website, socialLinks: a.socialLinks, goals: a.goals, participation: a.participation,
    status: a.status, rejectReason: a.rejectReason, createdAt: a.createdAt,
  };
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const rows = await prisma.organizationApplication.findMany({ where: { userId: Number(auth.user.userId) }, orderBy: { id: 'desc' }, take: 10 });
    return NextResponse.json({ applications: rows.map(serialize) });
  } catch (error) {
    console.error('Get organization applications error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const limit = checkRateLimit(`orgapp:create:${userId}`, { interval: 24 * 60 * 60 * 1000, maxRequests: 5 });
    if (!limit.allowed) return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const name = str(body?.name, 150);
    const direction = str(body?.direction, 150);
    const city = str(body?.city, 100);
    const description = str(body?.description, 3000);
    const country = str(body?.country, 100) || null;
    const phone = str(body?.phone, 30) || null;
    const email = str(body?.email, 150) || null;
    let website = str(body?.website, 255) || null;
    const socialLinks = str(body?.socialLinks, 500) || null;
    const goals = str(body?.goals, 2000) || null;
    const participation = str(body?.participation, 1000) || null;

    if (!name || !direction || !city || description.length < 20) {
      return NextResponse.json({ error: t('api.organizationApplications.fieldsInvalid') }, { status: 400 });
    }
    if (!phone && !email) return NextResponse.json({ error: t('api.organizationApplications.contactRequired') }, { status: 400 });
    if (phone && !/^\+?[0-9 ()-]{7,30}$/.test(phone)) return NextResponse.json({ error: t('api.businessApplications.phoneInvalid') }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: t('api.organizationApplications.emailInvalid') }, { status: 400 });
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    if (website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) return NextResponse.json({ error: t('api.businessApplications.websiteInvalid') }, { status: 400 });

    const active = await prisma.organizationApplication.findFirst({ where: { userId, status: { in: ['pending', 'approved'] } }, select: { id: true } });
    if (active) return NextResponse.json({ error: t('api.businessApplications.alreadyExists') }, { status: 409 });

    const created = await prisma.organizationApplication.create({
      data: { userId, name, direction, description, country, city, phone, email, website, socialLinks, goals, participation },
    });
    return NextResponse.json({ application: serialize(created), message: t('api.businessApplications.submitted') }, { status: 201 });
  } catch (error) {
    console.error('Create organization application error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
