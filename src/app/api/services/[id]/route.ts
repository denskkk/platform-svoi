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
import { getApiT } from '@/i18n/server';

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
  const t = getApiT(request);
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

    if (!service) {
      return NextResponse.json(
        { error: t('api.services.notFound') },
        { status: 404 }
      );
    }

    return NextResponse.json({ service });

  } catch (error) {
    console.error('Get service error:', error);
    return NextResponse.json(
      { error: t('api.common.serverError') },
      { status: 500 }
    );
  }
}

// PUT - Оновити послугу
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const t = getApiT(request);
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
        { error: t('api.services.notFound') },
        { status: 404 }
      );
    }

    if (service.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: t('api.services.forbiddenUpdate') },
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
      message: t('api.services.updated'),
      service: updatedService,
    });

  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json(
      { error: t('api.common.serverError') },
      { status: 500 }
    );
  }
}

// DELETE - Видалити послугу
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const t = getApiT(request);
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
        { error: t('api.services.notFound') },
        { status: 404 }
      );
    }

    if (service.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: t('api.services.forbiddenDelete') },
        { status: 403 }
      );
    }

    await prisma.service.delete({
      where: { id: serviceId }
    });

    return NextResponse.json({
      success: true,
      message: t('api.services.deleted'),
    });

  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      { error: t('api.common.serverError') },
      { status: 500 }
    );
  }
}
