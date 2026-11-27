/**
 * DELETE /api/conversations/:id — видалити чат «у себе»: історія ховається для мене, співрозмовник її зберігає.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const userId = Number(user.userId);
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: t('api.chat.invalidConversationId') }, { status: 400 });
    const conv = await prisma.conversation.findFirst({ where: { id, OR: [{ user1Id: userId }, { user2Id: userId }] }, select: { id: true, user1Id: true } });
    if (!conv) return NextResponse.json({ error: t('api.chat.conversationNotFound') }, { status: 404 });
    const now = new Date();
    await prisma.conversation.update({ where: { id }, data: conv.user1Id === userId ? { user1ClearedAt: now } : { user2ClearedAt: now } });
    // Непрочитане в очищеному чаті більше не світиться
    await prisma.message.updateMany({ where: { conversationId: id, receiverId: userId, isRead: false }, data: { isRead: true } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[conversations DELETE]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
