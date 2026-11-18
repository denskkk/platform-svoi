/**
 * GET    /api/me/linked-accounts            — зв'язані акаунти (особистий ↔ бізнес)
 * POST   /api/me/linked-accounts {email,password} — зв'язати акаунт (пароль іншого акаунта підтверджує, що він ваш)
 * DELETE /api/me/linked-accounts {userId}   — роз'єднати
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { passwordMatches, passwordVariants } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
const MAX_LINKS = 5;

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const rows = await prisma.linkedAccount.findMany({
      where: { userId: Number(user.userId) },
      include: { linked: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, accountType: true, isActive: true, businessInfo: { select: { companyName: true } } } } },
    });
    return NextResponse.json({
      accounts: rows.filter((r: any) => r.linked.isActive).map((r: any) => ({
        id: r.linked.id, name: r.linked.businessInfo?.companyName || `${r.linked.firstName} ${r.linked.lastName}`.trim(),
        avatarUrl: r.linked.avatarUrl, accountType: r.linked.accountType,
      })),
    });
  } catch (e) {
    console.error('[linked GET]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const me = Number(user.userId);
    if (!checkRateLimit(`linkacc:${me}`, { interval: 15 * 60 * 1000, maxRequests: 8 }).allowed) {
      return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });
    }
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!email || !password) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    const target = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, passwordHash: true, isActive: true } });
    if (!target?.isActive || !(await passwordMatches(passwordVariants(password), target.passwordHash))) {
      return NextResponse.json({ error: t('api.auth.invalidCredentials') }, { status: 401 });
    }
    if (target.id === me) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    if ((await prisma.linkedAccount.count({ where: { userId: me } })) >= MAX_LINKS) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    await prisma.linkedAccount.createMany({ data: [{ userId: me, linkedUserId: target.id }, { userId: target.id, linkedUserId: me }], skipDuplicates: true });
    await logAudit({ actorId: me, action: 'account.link', entityType: 'user', entityId: target.id });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[linked POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const me = Number(user.userId);
    const other = Number((await request.json().catch(() => ({})))?.userId);
    if (!Number.isInteger(other)) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    await prisma.linkedAccount.deleteMany({ where: { OR: [{ userId: me, linkedUserId: other }, { userId: other, linkedUserId: me }] } });
    await logAudit({ actorId: me, action: 'account.unlink', entityType: 'user', entityId: other });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[linked DELETE]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
