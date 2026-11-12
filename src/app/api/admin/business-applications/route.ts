/** GET /api/admin/business-applications?status=pending|approved|rejected&cursor=<id> — черга заявок (адміністратор) */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminPermission } from '@/lib/adminAccess';
import { withAuth } from '@/lib/authMiddleware';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  const t = getApiT(request);
  try {
    const userId = Number((request as any).user?.userId);
    if (!userId || !(await hasAdminPermission(userId, 'business.review'))) return NextResponse.json({ error: t('api.common.adminOnly') }, { status: 403 });

    const params = new URL(request.url).searchParams;
    const status = ['pending', 'approved', 'rejected'].includes(params.get('status') || '') ? (params.get('status') as string) : 'pending';
    const cursor = parseId(params.get('cursor'));

    const rows = await prisma.businessApplication.findMany({
      where: { status, ...(cursor ? { id: status === 'pending' ? { gt: cursor } : { lt: cursor } } : {}) },
      orderBy: { id: status === 'pending' ? 'asc' : 'desc' },
      take: 21,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    const hasMore = rows.length > 20;
    const page = hasMore ? rows.slice(0, 20) : rows;

    return NextResponse.json({
      applications: page.map((a: any) => ({
        id: a.id, companyName: a.companyName, activity: a.activity, city: a.city, contactName: a.contactName,
        phone: a.phone, website: a.website, description: a.description, projectSlug: a.projectSlug,
        status: a.status, createdAt: a.createdAt, rejectReason: a.rejectReason,
        proposedRewardPercent: a.proposedRewardPercent === null ? null : Number(a.proposedRewardPercent),
        user: { id: a.user.id, name: `${a.user.firstName} ${a.user.lastName}`.trim(), email: a.user.email },
      })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error('Admin business applications error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler);
}
