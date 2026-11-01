/**
 * GET /api/cities
 * Отримати всі міста України
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiT } from '@/i18n/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const t = getApiT(request);
  try {
    const cities = await prisma.city.findMany({
      orderBy: {
        usersCount: 'desc'
      }
    });

    return NextResponse.json({ cities });

  } catch (error) {
    console.error('Get cities error:', error);
    return NextResponse.json(
      { error: t('api.common.serverError') },
      { status: 500 }
    );
  }
}
