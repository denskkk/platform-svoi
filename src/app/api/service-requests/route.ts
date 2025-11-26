import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// POST /api/service-requests - Створити нову заявку
async function createHandler(request: NextRequest) {
  try {
    const userId = (request as any).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      city,
      address,
      photos = [],
      budgetFrom,
      budgetTo,
      budgetMin, // Підтримка альтернативної назви
      budgetMax, // Підтримка альтернативної назви
      desiredDate,
      deadline,
      priority = 'normal',
      serviceId
    } = body;
    
    // Використати budgetMin/budgetMax якщо budgetFrom/budgetTo не передані
    const finalBudgetFrom = budgetFrom !== undefined ? budgetFrom : budgetMin;
    const finalBudgetTo = budgetTo !== undefined ? budgetTo : budgetMax;

    // Валідація
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Заповніть обов\'язкові поля: назва та опис' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Назва занадто довга (макс. 200 символів)' },
        { status: 400 }
      );
    }

    // Якщо переданий serviceId, перевіряємо що така послуга існує
    if (serviceId) {
      const serviceExists = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
      if (!serviceExists) {
        return NextResponse.json(
          { error: 'Послугу не знайдено або вона недоступна' },
          { status: 400 }
        );
      }
    }

    // Створити заявку
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        clientId: userId,
        title,
        description,
        category,
        city,
        address,
        photos: Array.isArray(photos) ? photos : [],
        budgetFrom: finalBudgetFrom ? new Decimal(finalBudgetFrom) : null,
        budgetTo: finalBudgetTo ? new Decimal(finalBudgetTo) : null,
        desiredDate: desiredDate ? new Date(desiredDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        priority,
        serviceId: serviceId ? Number(serviceId) : null,
        status: "new" as any,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            city: true,
            avatarUrl: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            title: true,
            category: {
              select: {
                name: true,
                emoji: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      request: serviceRequest
    }, { status: 201 });

  } catch (error: any) {
    console.error('[service-requests/create] Error:', error);
    return NextResponse.json(
      { error: 'Помилка створення заявки', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/service-requests - Отримати список заявок
async function listHandler(request: NextRequest) {
  try {
    const userId = (request as any).user?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const type = searchParams.get('type'); // 'my' (створені мною), 'available' (доступні), 'assigned' (призначені мені)
    const serviceId = searchParams.get('serviceId');

    const skip = (page - 1) * limit;

    const where: any = {};

    // Фільтр по типу
    if (type === 'my') {
      where.clientId = userId;
    } else if (type === 'assigned') {
      where.executorId = userId;
    } else if (type === 'available') {
      // Доступні заявки - нові або переглянуті, але не призначені
      where.status = { in: ['new', 'viewed'] };
      where.executorId = null;
    }

    // Додаткові фільтри
    if (status) where.status = status;
    if (category) where.category = category;
    if (city) where.city = city;
    if (serviceId) where.serviceId = parseInt(serviceId);

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              city: true,
              avatarUrl: true,
              phone: true,
              avgRating: true,
              totalReviews: true
            }
          },
          executor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              city: true,
              avatarUrl: true,
              phone: true,
              avgRating: true,
              totalReviews: true
            }
          },
          service: {
            select: {
              id: true,
              title: true,
              category: {
                select: {
                  name: true,
                  emoji: true
                }
              }
            }
          },
          _count: {
            select: {
              reviews: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.serviceRequest.count({ where })
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('[service-requests/list] Error:', error);
    return NextResponse.json(
      { error: 'Помилка отримання заявок', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, createHandler);
}

export async function GET(request: NextRequest) {
  return withAuth(request, listHandler);
}
