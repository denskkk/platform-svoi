/**
 * GET /api/services
 * Отримати список послуг з фільтрами та пошуком
 * 
 * POST /api/services
 * Створити нову послугу (потрібна авторизація)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission, requireAuth } from '@/lib/api-middleware';
import { chargeForAction } from '@/lib/ucm';
import { apiCache, invalidateCache } from '@/lib/cache';
import { getAuthCookie } from '@/lib/cookies';
import { awardUcmForAction } from '@/lib/earning';

// GET - Отримати послуги з фільтрами
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Створити ключ кешу на основі параметрів запиту
    const cacheKey = `services:${searchParams.toString()}`;
    
    // Перевірити кеш (5 хвилин TTL)
    const cached = apiCache.get(cacheKey);
    if (cached) {
      console.log(`[Cache HIT] ${cacheKey}`);
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    console.log(`[Cache MISS] ${cacheKey}`);

    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const priceFrom = searchParams.get('priceFrom');
    const priceTo = searchParams.get('priceTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    // Побудова фільтрів
    const where: any = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (city) {
      where.city = city;
    }

    if (priceFrom) {
      where.priceFrom = { gte: parseFloat(priceFrom) };
    }

    if (priceTo) {
      where.priceTo = { lte: parseFloat(priceTo) };
    }

    // Отримати послуги
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              city: true,
              avgRating: true,
              totalReviews: true,
              isVerified: true,
              businessInfo: {
                select: {
                  companyName: true,
                  logoUrl: true,
                }
              },
            }
          },
          category: true,
        },
        orderBy: [
          { user: { avgRating: 'desc' } },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.service.count({ where })
    ]);

    const result = {
      services,
      // optionally include requests (promoted or public)
      requests: [] as any[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };

    // If client asked to include requests (e.g. includeRequests=1), fetch active requests
    if (searchParams.get('includeRequests') === '1') {
      try {
        const requests = await prisma.request.findMany({
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        });

        // Attach requests separately so client can merge them into listing
        (result as any).requests = requests.map((r: any) => ({
          id: r.id,
          kind: 'request',
          requestType: r.type,
          title: r.title,
          description: r.description,
          city: r.city,
          createdAt: r.createdAt,
          isPaid: r.isPaid,
          priceUcm: r.priceUcm,
        }));
      } catch (err) {
        console.warn('Failed to load requests for services listing:', err);
      }
    }

    // Зберегти в кеш на 5 хвилин (300 секунд)
    apiCache.set(cacheKey, result, 300);

    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS' }
    });

  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

// POST - Створити послугу
export async function POST(request: NextRequest) {
  try {
    // Перевіряємо авторизацію (доступ до створення послуг на клієнті вже знято)
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();

    // Валідація
    if (!body.categoryId || !body.title || !body.city) {
      return NextResponse.json(
        { error: 'Заповніть всі обов\'язкові поля' },
        { status: 400 }
      );
    }

    const userId = Number(authResult.user.userId);
    const accountType = authResult.user.accountType;

    // Validate numeric price fields to avoid DB numeric overflow (Decimal(10,2) limit)
    const parseSafeNumber = (v: any): number | null => {
      if (v === undefined || v === null || v === '') return null;
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      if (!isFinite(n)) return null;
      // Decimal(10,2) accepts absolute values less than 1e8
      if (Math.abs(n) >= 1e8) return null;
      // Round to 2 decimals
      return Math.round(n * 100) / 100;
    };

    const safePriceFrom = parseSafeNumber(body.priceFrom);
    const safePriceTo = parseSafeNumber(body.priceTo);

    const serviceData: any = {
      userId,
      categoryId: body.categoryId,
      title: body.title,
      description: body.description,
      priceFrom: safePriceFrom,
      priceTo: safePriceTo,
      priceUnit: body.priceUnit || 'грн',
      city: body.city,
      region: body.region || null,
      address: body.address || null,
    };

    if (body.imageUrl) {
      serviceData.imageUrl = body.imageUrl;
    }

    // If user is basic — charge a small creation fee (1 уцм) but do NOT overwrite the service's price
    if (accountType === 'basic') {
      try {
        await chargeForAction({ userId, amount: 1, reason: 'create_service', related: { type: 'service' } });
      } catch (e: any) {
        console.error('[create service] failed charging basic user:', e?.message || e);
        return NextResponse.json({ error: 'Недостатньо уцмок на балансі' }, { status: 402 });
      }
    }

    const service = await prisma.service.create({
      data: serviceData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            businessInfo: {
              select: {
                companyName: true,
                logoUrl: true,
              }
            },
          }
        },
        category: true,
      }
    });

    // Інвалідувати кеш послуг (бо створили нову)
    invalidateCache('services:');


    // Нарахувати бонус за першу послугу
    try {
      const userServices = await prisma.service.count({
        where: { userId: authResult.user.userId }
      });
      
      if (userServices === 1) {
        await awardUcmForAction(authResult.user.userId, 'FIRST_SERVICE');
      }
    } catch (error) {
      console.error('Error awarding first service bonus:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Послугу створено!',
      service,
    }, { status: 201 });

  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
