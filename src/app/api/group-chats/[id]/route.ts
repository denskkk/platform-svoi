/**
 * PATCH  /api/group-chats/:id { title } — перейменувати (лише власник)
 * DELETE /api/group-chats/:id — видалити групу разом з повідомленнями (лише власник)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { parseId } from '@/lib/feed';

export const dynamic = 'force-dynamic';

async function ownedGroup(request: NextRequest, idParam: string) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return { res: error } as const;
  const gid = parseId(idParam);
  const group = gid ? await prisma.groupChat.findUnique({ where: { id: gid } }) : null;
  if (!group) return { res: NextResponse.json({ error: t('api.groupChats.notFound') }, { status: 404 }) } as const;
  if (group.ownerId !== Number(user.userId)) return { res: NextResponse.json({ error: t('api.groupChats.notOwner') }, { status: 403 }) } as const;
  return { group, t } as const;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const g = await ownedGroup(request, params.id);
  if ('res' in g) return g.res;
  try {
    const title = String((await request.json().catch(() => ({})))?.title ?? '').trim();
    if (title.length < 2 || title.length > 100) return NextResponse.json({ error: g.t('api.groupChats.invalid') }, { status: 400 });
    await prisma.groupChat.update({ where: { id: g.group.id }, data: { title } });
    return NextResponse.json({ success: true, title });
  } catch (e) {
    console.error('[group PATCH]', e);
    return NextResponse.json({ error: g.t('api.common.serverError') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const g = await ownedGroup(request, params.id);
  if ('res' in g) return g.res;
  try {
    await prisma.groupChat.delete({ where: { id: g.group.id } }); // учасники й повідомлення видаляються каскадно
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[group DELETE]', e);
    return NextResponse.json({ error: g.t('api.common.serverError') }, { status: 500 });
  }
}
