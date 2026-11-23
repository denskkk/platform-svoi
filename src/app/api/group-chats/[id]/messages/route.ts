/**
 * GET  /api/group-chats/:id/messages?after=<id> — повідомлення (нові після id; без after — останні 50). Позначає прочитаним.
 * POST /api/group-chats/:id/messages { content }
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { parseId } from '@/lib/feed';
import { GROUP_CHAT_LIMITS } from '@/lib/groupChats';

export const dynamic = 'force-dynamic';

async function member(groupId: number, userId: number) {
  return prisma.groupChatMember.findUnique({ where: { groupChatId_userId: { groupChatId: groupId, userId } }, include: { group: { select: { id: true, title: true, ownerId: true } } } });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const userId = Number(user.userId);
    const gid = parseId(params.id);
    const m = gid ? await member(gid, userId) : null;
    if (!m) return NextResponse.json({ error: t('api.groupChats.notFound') }, { status: 404 });
    const after = parseId(new URL(request.url).searchParams.get('after'));
    const rows = await prisma.groupMessage.findMany({
      where: { groupChatId: gid, ...(after ? { id: { gt: after } } : {}) },
      orderBy: { id: after ? 'asc' : 'desc' }, take: GROUP_CHAT_LIMITS.pageSize,
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
    if (!after) rows.reverse();
    await prisma.groupChatMember.update({ where: { groupChatId_userId: { groupChatId: gid, userId } }, data: { lastReadAt: new Date() } });
    const members = after ? undefined : (await prisma.groupChatMember.findMany({ where: { groupChatId: gid }, include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } }, take: GROUP_CHAT_LIMITS.maxMembers }))
      .map((x: any) => ({ id: x.user.id, name: `${x.user.firstName} ${x.user.lastName}`.trim(), avatarUrl: x.user.avatarUrl }));
    return NextResponse.json({
      group: { id: m.group.id, title: m.group.title, isOwner: m.group.ownerId === userId }, members,
      messages: rows.map((r: any) => ({ id: r.id, content: r.content, createdAt: r.createdAt, mine: r.senderId === userId, sender: { id: r.sender.id, name: `${r.sender.firstName} ${r.sender.lastName}`.trim(), avatarUrl: r.sender.avatarUrl } })),
    });
  } catch (e) {
    console.error('[group messages GET]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const userId = Number(user.userId);
    const gid = parseId(params.id);
    const m = gid ? await member(gid, userId) : null;
    if (!m) return NextResponse.json({ error: t('api.groupChats.notFound') }, { status: 404 });
    if (!checkRateLimit(`gchat:msg:${userId}`, { interval: 60 * 1000, maxRequests: 30 }).allowed) {
      return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });
    }
    const body = await request.json().catch(() => ({}));
    const text = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!text || text.length > GROUP_CHAT_LIMITS.messageMax) return NextResponse.json({ error: t('api.groupChats.invalid') }, { status: 400 });
    const msg = await prisma.groupMessage.create({ data: { groupChatId: gid, senderId: userId, content: text } });
    await prisma.groupChat.update({ where: { id: gid }, data: { lastMessageAt: msg.createdAt } });
    return NextResponse.json({ success: true, id: msg.id }, { status: 201 });
  } catch (e) {
    console.error('[group messages POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
