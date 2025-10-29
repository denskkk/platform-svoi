/**
 * GET /api/services
 * Отримати список послуг з фільтрами та пошуком
 * 
 * POST /api/services
 * Створити нову послугу (потрібна авторизація)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { apiCache, invalidateCache } from '@/lib/cache';
import { getAuthCookie } from '@/lib/cookies';

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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };

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
    // Спочатку перевіряємо cookie, потім Authorization header
    let token: string | undefined = getAuthCookie(request);
    
    if (!token) {
      const authorization = request.headers.get('authorization');
      if (authorization) {
        token = getTokenFromHeader(authorization) || undefined;
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Невірний токен' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Валідація
    if (!body.categoryId || !body.title || !body.city) {
      return NextResponse.json(
        { error: 'Заповніть всі обов\'язкові поля' },
        { status: 400 }
      );
    }

    const serviceData: any = {
      userId: payload.userId,
      categoryId: body.categoryId,
      title: body.title,
      description: body.description,
      priceFrom: body.priceFrom,
      priceTo: body.priceTo,
      priceUnit: body.priceUnit || 'грн',
      city: body.city,
      region: body.region || null,
      address: body.address || null,
    };

    if (body.imageUrl) {
      serviceData.imageUrl = body.imageUrl;
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
          }
        },
        category: true,
      }
    });

    // Інвалідувати кеш послуг (бо створили нову)
    invalidateCache('services:');

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
