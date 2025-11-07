/**
 * GET /api/services/[id]
 * Отримати конкретну послугу
 * 
 * PUT /api/services/[id]
 * Оновити послугу (тільки власник)
 * 
 * DELETE /api/services/[id]
 * Видалити послугу (тільки власник)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthWithPermission } from '@/lib/api-middleware';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Отримати послугу
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const serviceId = parseInt(params.id);

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            city: true,
            region: true,
            bio: true,
            avgRating: true,
            totalReviews: true,
            isVerified: true,
          }
        },
        category: true,
      }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Послугу не знайдено' },
        { status: 404 }
      );
    }

    return NextResponse.json({ service });

  } catch (error) {
    console.error('Get service error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

// PUT - Оновити послугу
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const serviceId = parseInt(params.id);
    const auth = await requireAuthWithPermission(request, 'EDIT_SERVICE');
    if (auth.error) return auth.error;

    // Перевірка що послуга належить користувачу
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Послугу не знайдено' },
        { status: 404 }
      );
    }

    if (service.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: 'Немає прав на оновлення цієї послуги' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { categoryId, title, description, priceFrom, priceTo, priceUnit, city } = body;

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        categoryId,
        title,
        description,
        priceFrom,
        priceTo,
        priceUnit,
        city,
      },
      include: {
        category: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Послугу оновлено!',
      service: updatedService,
    });

  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

// DELETE - Видалити послугу
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const serviceId = parseInt(params.id);
    const auth = await requireAuthWithPermission(request, 'DELETE_SERVICE');
    if (auth.error) return auth.error;

    // Перевірка що послуга належить користувачу
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Послугу не знайдено' },
        { status: 404 }
      );
    }

    if (service.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: 'Немає прав на видалення цієї послуги' },
        { status: 403 }
      );
    }

    await prisma.service.delete({
      where: { id: serviceId }
    });

    return NextResponse.json({
      success: true,
      message: 'Послугу видалено!',
    });

  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
