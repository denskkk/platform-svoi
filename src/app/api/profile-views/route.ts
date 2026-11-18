/** POST /api/profile-views { profileId } — фіксує перегляд чужого профілю (не частіше разу на добу від одного глядача). */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getSettings } from '@/lib/userSettings';

export const dynamic = 'force-dynamic';

/** GET — хто заходив до мого профілю за 30 днів (лише якщо ввімкнено в налаштуваннях). */
export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const id = Number(user.userId);
    if (!(await getSettings(id)).privacy.showProfileViewers) return NextResponse.json({ enabled: false, viewers: [] });
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await prisma.profileView.findMany({
      where: { profileId: id, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 60,
      select: { createdAt: true, viewer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, isActive: true } } },
    });
    const seen = new Set<number>();
    const viewers = rows
      .filter((r: any) => r.viewer.isActive && !seen.has(r.viewer.id) && !!seen.add(r.viewer.id))
      .map((r: any) => ({ id: r.viewer.id, name: `${r.viewer.firstName} ${r.viewer.lastName}`.trim(), avatarUrl: r.viewer.avatarUrl, at: r.createdAt }));
    return NextResponse.json({ enabled: true, viewers });
  } catch (e) {
    console.error('[profile-views GET]', e);
    return NextResponse.json({ enabled: true, viewers: [] });
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const viewerId = Number(user.userId);
    const body = await request.json().catch(() => ({}));
    const profileId = Number(body?.profileId);
    if (!Number.isInteger(profileId) || profileId <= 0 || profileId === viewerId) return NextResponse.json({ ok: true });
    if (!(await getSettings(viewerId)).privacy.recordProfileViews) return NextResponse.json({ ok: true });
    const target = await prisma.user.findUnique({ where: { id: profileId }, select: { id: true } });
    if (!target) return NextResponse.json({ ok: true });
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const exists = await prisma.profileView.findFirst({ where: { viewerId, profileId, createdAt: { gte: dayAgo } }, select: { id: true } });
    if (!exists) await prisma.profileView.create({ data: { viewerId, profileId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[profile-views]', e);
    return NextResponse.json({ ok: true }); // службова метрика не повинна ламати сторінку
  }
}
