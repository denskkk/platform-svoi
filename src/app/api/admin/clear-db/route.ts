/**
 * POST /api/admin/clear-db
 * Очистити ВСІ дані (НЕ production!). Захист: X-Admin-Secret header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const provided = request.headers.get('x-admin-secret') || '';
    const expected = process.env.ADMIN_SECRET || '';
    if (!expected || provided !== expected) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const reviews = await prisma.review.deleteMany({});
    const sessions = await prisma.session.deleteMany({});
    const services = await prisma.service.deleteMany({});
    const businessInfo = await prisma.businessInfo.deleteMany({});
    const users = await prisma.user.deleteMany({});

    return NextResponse.json({
      success: true,
      counts: {
        users: users.count,
        services: services.count,
        businessInfo: businessInfo.count,
        reviews: reviews.count,
        sessions: sessions.count,
      }
    });
  } catch (e) {
    console.error('Admin clear-db error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
