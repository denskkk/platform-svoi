/**
 * GET /api/business-info?userId=1
 * Отримати бізнес-профіль користувача
 * 
 * POST /api/business-info
 * Створити бізнес-профіль
 * 
 * PUT /api/business-info
 * Оновити бізнес-профіль
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromHeader } from '@/lib/auth';
import { requireAuthWithPermission } from '@/lib/api-middleware';
import { getAuthCookie } from '@/lib/cookies';

// GET - Отримати бізнес-профіль
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId обов\'язковий' },
        { status: 400 }
      );
    }

    const businessInfo = await prisma.businessInfo.findUnique({
      where: { userId: parseInt(userId) }
    });

    if (!businessInfo) {
      return NextResponse.json(
        { businessInfo: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ businessInfo });

  } catch (error) {
    console.error('Get business info error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

// POST - Створити бізнес-профіль
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthWithPermission(request, 'EDIT_BUSINESS_PROFILE');
    if (auth.error) return auth.error;

    const body = await request.json();

    // Проверка что бизнес-профиль еще не создан
    const existing = await prisma.businessInfo.findUnique({
      where: { userId: auth.user.userId }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Бізнес-профіль вже існує' },
        { status: 400 }
      );
    }

    // Підтягнемо користувача для дефолтних контактів/локації
  const user = await prisma.user.findUnique({ where: { id: auth.user.userId } });

    // Нормалізація та маппінг полів згідно зі схемою
    const createData: any = {
  userId: auth.user.userId,
    };

    if (body.companyName !== undefined) createData.companyName = body.companyName;
    if (body.companyCode !== undefined) createData.companyCode = body.companyCode;
    if (body.companyType !== undefined) createData.companyType = body.companyType;
    if (body.businessCategory !== undefined) createData.businessCategory = body.businessCategory;
    if (body.offerType !== undefined) createData.offerType = body.offerType;
    if (body.representativeName !== undefined) createData.representativeName = body.representativeName;
    if (body.position !== undefined) createData.position = body.position;
    if (body.city !== undefined) createData.city = body.city; else if (user?.city) createData.city = user.city;
    if (body.region !== undefined) createData.region = body.region; else if (user?.region) createData.region = user.region;
    if (body.businessType !== undefined) createData.businessType = body.businessType;

    if (body.logoUrl !== undefined) createData.logoUrl = body.logoUrl;
  if (body.bannerUrl !== undefined) createData.bannerUrl = body.bannerUrl;

    // Опис: shortDescription -> description
    if (body.shortDescription !== undefined) createData.description = body.shortDescription;
    if (body.description !== undefined) createData.description = body.description;
    if (body.mission !== undefined) createData.mission = body.mission;
    if (body.uniqueValue !== undefined) createData.uniqueValue = body.uniqueValue;

    // Послуги/ціни/графік: workingHours -> workHours
    if (body.servicesList !== undefined) createData.servicesList = body.servicesList;
    if (body.priceRange !== undefined) createData.priceRange = body.priceRange;
    if (body.workingHours !== undefined) createData.workHours = body.workingHours;
    if (body.workHours !== undefined) createData.workHours = body.workHours;
    if (body.serviceLocation !== undefined) createData.serviceLocation = body.serviceLocation;
    if (body.address !== undefined) createData.address = body.address;

    // Команда
    if (body.employeeCount !== undefined) createData.employeeCount = body.employeeCount;
    if (body.keySpecialists !== undefined) createData.keySpecialists = body.keySpecialists;
    if (body.teamDescription !== undefined) createData.teamDescription = body.teamDescription;

    // Контакти (дефолт з профілю користувача, якщо не задано)
    if (body.phone !== undefined) createData.phone = body.phone; else if (user?.phone) createData.phone = user.phone;
    if (body.viber !== undefined) createData.viber = body.viber;
    if (body.telegram !== undefined) createData.telegram = body.telegram;
    if (body.email !== undefined) createData.email = body.email; else if (user?.email) createData.email = user.email;
    if (body.website !== undefined) createData.website = body.website;

    // Соцмережі/медіа
    if (body.socialLinks !== undefined) {
      if (typeof body.socialLinks === 'string') {
        try {
          createData.socialLinks = JSON.parse(body.socialLinks);
        } catch {
          // якщо не валідний JSON, збережемо як порожній об'єкт
          createData.socialLinks = {};
        }
      } else {
        createData.socialLinks = body.socialLinks;
      }
    }
    if (body.videoUrl !== undefined) createData.videoUrl = body.videoUrl;

    // Зовнішні відгуки
    if (body.externalReviews !== undefined) {
      if (typeof body.externalReviews === 'string') {
        try {
          createData.externalReviews = JSON.parse(body.externalReviews);
        } catch {
          // якщо це просто URL-рядок, покладемо як рядок
          createData.externalReviews = body.externalReviews;
        }
      } else {
        createData.externalReviews = body.externalReviews;
      }
    }

    // Додатково
    if (body.yearFounded !== undefined) createData.yearFounded = body.yearFounded;
    if (body.registrationType !== undefined) createData.registrationType = body.registrationType;
    if (body.hasCertificates !== undefined) createData.hasCertificates = body.hasCertificates;
    if (body.certificatesInfo !== undefined) createData.certificatesInfo = body.certificatesInfo;
    if (body.partners !== undefined) createData.partners = body.partners;

    // Пошук (для Бізнес акаунтів)
    if (body.seekingPartner !== undefined) createData.seekingPartner = body.seekingPartner;
    if (body.seekingInvestor !== undefined) createData.seekingInvestor = body.seekingInvestor;
    if (body.seekingCustomer !== undefined) createData.seekingCustomer = body.seekingCustomer;
    if (body.seekingEmployee !== undefined) createData.seekingEmployee = body.seekingEmployee;

    const businessInfo = await prisma.businessInfo.create({
      data: createData
    });

    return NextResponse.json({
      success: true,
      message: 'Бізнес-профіль створено!',
      businessInfo,
    });

  } catch (error) {
    console.error('Create business info error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

// PUT - Оновити бізнес-профіль
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuthWithPermission(request, 'EDIT_BUSINESS_PROFILE');
    if (auth.error) return auth.error;

    const body = await request.json();

    // Підтягнемо користувача для дефолтів на випадок створення
  const user = await prisma.user.findUnique({ where: { id: auth.user.userId } });

    // Підготовка даних для оновлення (оновлюємо тільки передані поля)
    const updateData: any = {};

    if (body.companyName !== undefined) updateData.companyName = body.companyName;
    if (body.companyCode !== undefined) updateData.companyCode = body.companyCode;
    if (body.companyType !== undefined) updateData.companyType = body.companyType;
    if (body.businessCategory !== undefined) updateData.businessCategory = body.businessCategory;
    if (body.offerType !== undefined) updateData.offerType = body.offerType;
    if (body.representativeName !== undefined) updateData.representativeName = body.representativeName;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.region !== undefined) updateData.region = body.region;
    if (body.businessType !== undefined) updateData.businessType = body.businessType;

    // Опис: shortDescription -> description
    if (body.shortDescription !== undefined) updateData.description = body.shortDescription;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.mission !== undefined) updateData.mission = body.mission;
    if (body.uniqueValue !== undefined) updateData.uniqueValue = body.uniqueValue;

    // Послуги/ціни/графік: workingHours -> workHours
    if (body.servicesList !== undefined) updateData.servicesList = body.servicesList;
    if (body.priceRange !== undefined) updateData.priceRange = body.priceRange;
    if (body.workingHours !== undefined) updateData.workHours = body.workingHours;
    if (body.workHours !== undefined) updateData.workHours = body.workHours;
    if (body.serviceLocation !== undefined) updateData.serviceLocation = body.serviceLocation;
    if (body.address !== undefined) updateData.address = body.address;

    // Команда
    if (body.employeeCount !== undefined) updateData.employeeCount = body.employeeCount;
    if (body.keySpecialists !== undefined) updateData.keySpecialists = body.keySpecialists;
    if (body.teamDescription !== undefined) updateData.teamDescription = body.teamDescription;

    // Контакти
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.viber !== undefined) updateData.viber = body.viber;
    if (body.telegram !== undefined) updateData.telegram = body.telegram;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.website !== undefined) updateData.website = body.website;

    // Соцмережі/медіа
    if (body.socialLinks !== undefined) {
      if (typeof body.socialLinks === 'string') {
        try {
          updateData.socialLinks = JSON.parse(body.socialLinks);
        } catch {
          updateData.socialLinks = {};
        }
      } else {
        updateData.socialLinks = body.socialLinks;
      }
    }
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
  if (body.bannerUrl !== undefined) updateData.bannerUrl = body.bannerUrl;
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;

    // Зовнішні відгуки
    if (body.externalReviews !== undefined) {
      if (typeof body.externalReviews === 'string') {
        try {
          updateData.externalReviews = JSON.parse(body.externalReviews);
        } catch {
          updateData.externalReviews = body.externalReviews;
        }
      } else {
        updateData.externalReviews = body.externalReviews;
      }
    }

    // Додатково
    if (body.yearFounded !== undefined) updateData.yearFounded = body.yearFounded;
    if (body.registrationType !== undefined) updateData.registrationType = body.registrationType;
    if (body.hasCertificates !== undefined) updateData.hasCertificates = body.hasCertificates;
    if (body.certificatesInfo !== undefined) updateData.certificatesInfo = body.certificatesInfo;
    if (body.partners !== undefined) updateData.partners = body.partners;

    // Пошук (для Бізнес акаунтів)
    if (body.seekingPartner !== undefined) updateData.seekingPartner = body.seekingPartner;
    if (body.seekingInvestor !== undefined) updateData.seekingInvestor = body.seekingInvestor;
    if (body.seekingCustomer !== undefined) updateData.seekingCustomer = body.seekingCustomer;
    if (body.seekingEmployee !== undefined) updateData.seekingEmployee = body.seekingEmployee;

    // Дані для створення (upsert.create) з дефолтами з профілю
    const createData: any = {
      userId: auth.user.userId,
      ...updateData,
    };
    if (createData.city === undefined && user?.city) createData.city = user.city;
    if (createData.region === undefined && user?.region) createData.region = user.region;
    if (createData.phone === undefined && user?.phone) createData.phone = user.phone;
    if (createData.email === undefined && user?.email) createData.email = user.email;

    // Використовуємо upsert для створення або оновлення
    const businessInfo = await prisma.businessInfo.upsert({
      where: { userId: auth.user.userId },
      update: updateData,
      create: createData
    });

    return NextResponse.json({
      success: true,
      message: 'Бізнес-профіль оновлено!',
      businessInfo,
    });

  } catch (error) {
    console.error('Update business info error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
