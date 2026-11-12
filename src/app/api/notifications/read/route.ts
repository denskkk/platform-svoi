/**
 * POST /api/notifications/read { all: true } | { ids: number[] } — позначити прочитаними
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);

    const body = await request.json().catch(() => ({}));
    const ids: number[] = Array.isArray(body?.ids)
      ? body.ids.map(Number).filter((n: number) => Number.isInteger(n) && n > 0).slice(0, 200)
      : [];

    if (!body?.all && ids.length === 0) {
      return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: { userId, isRead: false, ...(body?.all ? {} : { id: { in: ids } }) },
      data: { isRead: true, readAt: new Date() },
    });
    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Read notifications error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
