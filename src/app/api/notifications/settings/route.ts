/**
 * GET /api/notifications/settings — { groups: [{ key, enabled }] }
 * PUT /api/notifications/settings { muted: string[] } — які групи вимкнено (social, messages, deals, reviews, requests)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { getMutedGroups, MUTABLE_GROUPS } from '@/lib/notificationSettings';

export const dynamic = 'force-dynamic';

async function load(userId: number) {
  const muted = await getMutedGroups(userId);
  return { groups: Object.keys(MUTABLE_GROUPS).map((key) => ({ key, enabled: !muted.includes(key) })) };
}

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    return NextResponse.json(await load(Number(auth.user.userId)));
  } catch (error) {
    console.error('Get notification settings error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const t = getApiT(request);
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const userId = Number(auth.user.userId);
    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body?.muted)) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    const muted = Array.from(new Set(body.muted.filter((g: unknown) => typeof g === 'string' && g in MUTABLE_GROUPS))) as string[];
    await prisma.notificationSetting.upsert({
      where: { userId },
      create: { userId, mutedGroups: muted.join(',') },
      update: { mutedGroups: muted.join(',') },
    });
    return NextResponse.json(await load(userId));
  } catch (error) {
    console.error('Save notification settings error:', error);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
