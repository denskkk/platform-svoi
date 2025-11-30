import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// POST /api/service-requests - Створити нову заявку
async function createHandler(request: NextRequest) {
  try {
    const userId = (request as any).user?.userId;
    const accountType = (request as any).user?.accountType;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    // Глядачі не можуть створювати заявки
    if (accountType === 'viewer') {
      return NextResponse.json(
        { error: 'Глядачі не можуть створювати заявки. Змініть тип акаунту в налаштуваннях.' },
        { status: 403 }
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
      serviceId,
      executorId,
      isPublic,              // Чи це публічна заявка (буде автоматично визначено нижче)
      isPromoted = false      // Чи просувати в топ
    } = body;
    
    // Автоматичне визначення isPublic:
    // - Якщо заявка під конкретну послугу (serviceId) → приватна (false)
    // - Якщо загальна заявка (без serviceId) → публічна (true)
    // - Можна перевизначити через body
    const finalIsPublic = isPublic !== undefined ? isPublic : !serviceId;
    
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

    // Якщо переданий serviceId, перевіряємо що така послуга існує і беремо executorId з неї
    let finalExecutorId = executorId;
    if (serviceId) {
      const service = await prisma.service.findUnique({ 
        where: { id: Number(serviceId) },
        select: { id: true, userId: true }
      });
      if (!service) {
        return NextResponse.json(
          { error: 'Послугу не знайдено або вона недоступна' },
          { status: 400 }
        );
      }
      // Автоматично встановлюємо виконавця як власника послуги
      finalExecutorId = service.userId;
      console.log(`[service-requests/create] Service ${serviceId} owner: ${service.userId}, setting as executor`);
    }
    
    console.log(`[service-requests/create] Creating request: client=${userId}, executor=${finalExecutorId}, service=${serviceId}`);

    // Розрахунок вартості заявки
    const basePrice = 5; // 5 UCM за будь-яку заявку
    const promoPrice = isPromoted ? 2 : 0; // +2 UCM за просування
    const totalPrice = basePrice + promoPrice;

    // Перевірка балансу користувача
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balanceUcm: true }
    });

    if (!user || Number(user.balanceUcm) < totalPrice) {
      return NextResponse.json(
        { error: `Недостатньо коштів. Потрібно ${totalPrice} UCM (${basePrice} UCM за заявку${promoPrice > 0 ? ` + ${promoPrice} UCM за просування` : ''})` },
        { status: 400 }
      );
    }

    // Розрахунок promotedUntil (3 дні від зараз, якщо isPromoted)
    const promotedUntil = isPromoted ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null;

    // Створити заявку
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        clientId: userId,
        executorId: finalExecutorId || null,
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
        isPublic: finalIsPublic,
        isPromoted,
        promotedUntil
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
        executor: {
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
    
    console.log(`[service-requests/create] Created request ID ${serviceRequest.id}: isPublic=${finalIsPublic}, isPromoted=${isPromoted}, status=${serviceRequest.status}`);
    
    // Списати UCM з балансу користувача
    await prisma.user.update({
      where: { id: userId },
      data: { balanceUcm: { decrement: totalPrice } }
    });

    // Створити транзакцію UCM
    await prisma.ucmTransaction.create({
      data: {
        userId,
        kind: 'service_request',
        amount: totalPrice,
        reason: isPromoted ? 'service_request_promo' : 'service_request',
        description: `Оплата заявки "${title}"${isPromoted ? ' (з просуванням в ТОП)' : ''}`,
        relatedEntityType: 'ServiceRequest',
        relatedEntityId: serviceRequest.id,
        meta: {
          serviceRequestId: serviceRequest.id,
          isPublic: finalIsPublic,
          isPromoted,
          basePrice,
          promoPrice
        }
      }
    });
    
    // Створити сповіщення для виконавця
    if (finalExecutorId) {
      try {
        await prisma.notification.create({
          data: {
            userId: finalExecutorId,
            type: 'service_request_new',
            title: 'Нова заявка',
            message: `Ви отримали нову заявку на послугу: "${title}"`,
            relatedEntityType: 'ServiceRequest',
            relatedEntityId: serviceRequest.id
          }
        });
      } catch (err) {
        console.error('Помилка створення сповіщення:', err);
      }
    }

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
    const type = searchParams.get('type'); // 'my' (створені мною), 'tome' (надіслані мені), 'assigned' (в роботі у мене)
    const serviceId = searchParams.get('serviceId');

    const skip = (page - 1) * limit;

    const where: any = {};

    // Фільтр по типу
    if (type === 'my') {
      // Заявки, які я створив (без скасованих та відхилених)
      where.clientId = userId;
      where.status = { notIn: ['cancelled', 'rejected'] };
    } else if (type === 'tome') {
      // Заявки, які надіслані мені (я виконавець)
      where.executorId = userId;
      where.status = { in: ['new', 'viewed'] }; // Тільки нові та переглянуті
    } else if (type === 'assigned') {
      // Заявки в роботі (я виконавець і заявка прийнята)
      where.executorId = userId;
      where.status = { in: ['accepted', 'in_progress', 'completed', 'paid'] };
    } else if (type === 'available') {
      // Доступні заявки - без виконавця
      where.executorId = null;
      where.status = { in: ['new', 'viewed'] };
    }
    
    console.log(`[service-requests/list] User ${userId}, type=${type}, where=`, JSON.stringify(where));

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
        orderBy: [
          // ТОП оголошення зверху (якщо ще активні)
          { isPromoted: 'desc' },
          // Потім сортуємо за датою створення (новіші зверху)
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.serviceRequest.count({ where })
    ]);

    // Фільтруємо просунуті заявки - показуємо тільки ті, що ще активні
    const now = new Date();
    const filteredRequests = requests.map((req: any) => {
      // Якщо заявка промоутнута, але термін минув - знімаємо флаг
      if (req.isPromoted && req.promotedUntil && req.promotedUntil < now) {
        return { ...req, isPromoted: false, promotedUntil: null };
      }
      return req;
    });

    return NextResponse.json({
      requests: filteredRequests,
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
