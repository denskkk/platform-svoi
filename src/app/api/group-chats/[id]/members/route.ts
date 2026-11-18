/**
 * POST   /api/group-chats/:id/members { userId } — додати (лише власник)
 * DELETE /api/group-chats/:id/members { userId? } — вийти (без userId) або видалити учасника (лише власник)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';
import { GROUP_CHAT_LIMITS } from '@/lib/groupChats';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const userId = Number(user.userId);
    const gid = parseId(params.id);
    const group = gid ? await prisma.groupChat.findUnique({ where: { id: gid }, include: { _count: { select: { members: true } } } }) : null;
    if (!group) return NextResponse.json({ error: t('api.groupChats.notFound') }, { status: 404 });
    if (group.ownerId !== userId) return NextResponse.json({ error: t('api.groupChats.notOwner') }, { status: 403 });
    const target = Number((await request.json().catch(() => ({})))?.userId);
    if (!Number.isInteger(target) || target <= 0 || group._count.members >= GROUP_CHAT_LIMITS.maxMembers) return NextResponse.json({ error: t('api.groupChats.invalid') }, { status: 400 });
    const u = await prisma.user.findUnique({ where: { id: target }, select: { id: true, isActive: true } });
    if (!u?.isActive) return NextResponse.json({ error: t('api.common.userNotFound') }, { status: 404 });
    await prisma.groupChatMember.upsert({ where: { groupChatId_userId: { groupChatId: gid, userId: target } }, update: {}, create: { groupChatId: gid, userId: target } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[group members POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const userId = Number(user.userId);
    const gid = parseId(params.id);
    const group = gid ? await prisma.groupChat.findUnique({ where: { id: gid } }) : null;
    if (!group) return NextResponse.json({ error: t('api.groupChats.notFound') }, { status: 404 });
    const raw = (await request.json().catch(() => ({})))?.userId;
    const target = raw ? Number(raw) : userId;
    if (target !== userId && group.ownerId !== userId) return NextResponse.json({ error: t('api.groupChats.notOwner') }, { status: 403 });
    if (target === group.ownerId) return NextResponse.json({ error: t('api.groupChats.ownerCannotLeave') }, { status: 400 });
    await prisma.groupChatMember.deleteMany({ where: { groupChatId: gid, userId: target } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[group members DELETE]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
