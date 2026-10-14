/**
 * POST /api/reports
 * Пожаловаться на користувача або його контент (послугу, заявку, відгук, повідомлення).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['spam', 'fraud', 'abuse', 'inappropriate', 'fake', 'other'] as const;
const CONTENT_TYPES = ['user', 'service', 'request', 'review', 'message'] as const;

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const reporterId = Number(user.userId);

    const limit = checkRateLimit(`report:${reporterId}`, {
      interval: 60 * 60 * 1000,
      maxRequests: 20,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Забагато скарг за короткий час. Спробуйте пізніше.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reportedUserId = Number(body?.reportedUserId);
    const category = String(body?.category || 'other');
    const contentType = String(body?.contentType || 'user');
    const contentId = body?.contentId !== undefined && body?.contentId !== null ? Number(body.contentId) : null;
    const details = String(body?.reason || '').trim();

    if (!Number.isInteger(reportedUserId) || reportedUserId <= 0) {
      return NextResponse.json({ error: 'Невірний користувач' }, { status: 400 });
    }
    if (reportedUserId === reporterId) {
      return NextResponse.json({ error: 'Не можна поскаржитися на себе' }, { status: 400 });
    }
    if (!(CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: 'Невірна категорія скарги' }, { status: 400 });
    }
    if (!(CONTENT_TYPES as readonly string[]).includes(contentType)) {
      return NextResponse.json({ error: 'Невірний тип матеріалу' }, { status: 400 });
    }
    if (details.length > 2000) {
      return NextResponse.json({ error: 'Опис скарги занадто довгий (макс. 2000 символів)' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: reportedUserId },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'Користувача не знайдено' }, { status: 404 });
    }

    const reference = contentType === 'user' || contentId === null || !Number.isInteger(contentId)
      ? 'профіль користувача'
      : `${contentType} #${contentId}`;

    await prisma.report.create({
      data: {
        reporterId,
        reportedUserId,
        category,
        reason: `[${reference}] ${details || 'Без додаткового опису'}`,
      },
    });

    return NextResponse.json({ success: true, message: 'Дякуємо! Скаргу надіслано адміністрації.' }, { status: 201 });
  } catch (e) {
    console.error('[reports] error', e);
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
  }
}
