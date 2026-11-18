/**
 * GET  /api/group-chats — мої групові чати (з непрочитаним)
 * POST /api/group-chats { title, memberIds[] } — створити (творець — власник)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { GROUP_CHAT_LIMITS } from '@/lib/groupChats';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const userId = Number(user.userId);
    const rows = await prisma.groupChatMember.findMany({
      where: { userId }, take: 100,
      include: { group: { include: { _count: { select: { members: true } }, messages: { orderBy: { id: 'desc' }, take: 1, select: { content: true, createdAt: true } } } } },
    });
    const chats = await Promise.all(rows.map(async (m: any) => ({
      id: m.group.id, title: m.group.title, members: m.group._count.members, isOwner: m.group.ownerId === userId,
      last: m.group.messages[0] ?? null, lastMessageAt: m.group.lastMessageAt ?? m.group.createdAt,
      unread: await prisma.groupMessage.count({ where: { groupChatId: m.group.id, createdAt: { gt: m.lastReadAt }, senderId: { not: userId } } }),
    })));
    chats.sort((a: any, b: any) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
    return NextResponse.json({ chats });
  } catch (e) {
    console.error('[group-chats GET]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const userId = Number(user.userId);
    if (user.accountType === 'viewer') return NextResponse.json({ error: t('api.chat.viewerCannotWrite') }, { status: 403 });
    if (!checkRateLimit(`gchat:create:${userId}`, { interval: 60 * 60 * 1000, maxRequests: 10 }).allowed) {
      return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });
    }
    const body = await request.json().catch(() => ({}));
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const ids: number[] = Array.from(new Set<number>((Array.isArray(body?.memberIds) ? body.memberIds : []).map(Number).filter((n: number) => Number.isInteger(n) && n > 0 && n !== userId)));
    if (title.length < 2 || title.length > 100 || ids.length > GROUP_CHAT_LIMITS.maxMembers - 1) return NextResponse.json({ error: t('api.groupChats.invalid') }, { status: 400 });
    const valid = ids.length ? await prisma.user.findMany({ where: { id: { in: ids }, isActive: true }, select: { id: true } }) : [];
    const group = await prisma.groupChat.create({
      data: { ownerId: userId, title, members: { create: [{ userId }, ...valid.map((u: any) => ({ userId: u.id }))] } },
    });
    return NextResponse.json({ success: true, id: group.id }, { status: 201 });
  } catch (e) {
    console.error('[group-chats POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
