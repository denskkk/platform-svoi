/**
 * GET /api/cities
 * Отримати всі міста України
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
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
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
