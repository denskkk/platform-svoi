/**
 * GET /api/profile/[id]
 * Отримати профіль користувача
 * 
 * PUT /api/profile/[id]
 * Оновити профіль користувача (тільки власник)
 */

import { NextRequest, NextResponse } from 'next/server';

// Завжди динамічно, без кешу — щоб зміни одразу відображались
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import { getAuthCookie } from '@/lib/cookies';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Отримати профіль
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Невірний ID користувача' },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        accountType: true,
        role: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        city: true,
        region: true,
        housingType: true,
        housingDetails: true,
        livingSituation: true,
        ucmMember: true,
        ucmSupporter: true,
        gender: true,
        age: true,
        maritalStatus: true,
        familyComposition: true,
        childrenCount: true,
        childrenAges: true,
        bio: true,
        // Транспорт
        hasCar: true,
        carInfo: true,
        otherTransport: true,
        carServices: true,
        // Професійна діяльність
        profession: true,
        employmentStatus: true,
        workplace: true,
        educationLevel: true,
        educationDetails: true,
        privateBusinessInfo: true,
        jobSeeking: true,
        seekingPartTime: true,
        seekingFullTime: true,
        wantsStartBusiness: true,
        // Домашні тварини
        hasPets: true,
        petsInfo: true,
        // Інтереси та стиль життя
        hobbies: true,
        outdoorActivities: true,
        lifestyle: true,
        sports: true,
        beautyServices: true,
        // Соцмережі
        socialLinks: true,
        // Споживчі переваги
        usesDelivery: true,
        restaurantFrequency: true,
        cuisinePreference: true,
        usesServices: true,
        usesBusinessServices: true,
        readyToSwitchToUCM: true,
        avgRating: true,
        totalReviews: true,
        isVerified: true,
        subscriptionActive: true,
        subscriptionExpiresAt: true,
        subscriptionStartedAt: true,
        createdAt: true,
        services: {
          include: {
            category: true
          }
        },
        businessInfo: true,
        reviewsReceived: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            services: true,
            reviewsReceived: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Користувача не знайдено' },
        { status: 404 }
      );
    }

    // Авто-деактивація підписки, якщо пробний період завершився
    try {
      const now = new Date();
      if (user.subscriptionActive && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < now) {
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionActive: false },
        });
        // Оновлюємо локального користувача, щоб повернути актуальні дані
        user = {
          ...user,
          subscriptionActive: false,
        };
      }
    } catch (e) {
      console.warn('[GET /api/profile] Не вдалося авто-деактивувати підписку:', e);
    }

    // Додаємо комбіноване поле education для зворотньої сумісності з фронтендом
    const now = new Date();
    const trialDaysLeft = user.subscriptionActive && user.subscriptionExpiresAt
      ? Math.max(0, Math.ceil((new Date(user.subscriptionExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const userWithEducation = {
      ...user,
      education: user.educationLevel || user.educationDetails || null,
      trialDaysLeft,
      trialStatus: user.subscriptionActive ? 'active' : (user.subscriptionExpiresAt ? 'expired' : 'none'),
    };

    return NextResponse.json({ user: userWithEducation });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

// PUT - Оновити профіль
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = parseInt(params.id);
    
    // Спочатку перевіряємо cookie, потім Authorization header
    let token: string | undefined = getAuthCookie(request);
    
    if (!token) {
      const authorization = request.headers.get('authorization');
      if (authorization) {
        token = getTokenFromHeader(authorization) || undefined;
      }
    }

    if (!token) {
      console.error('[PUT /api/profile] Токен не знайдено ні в cookie, ні в header');
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      console.error('[PUT /api/profile] Невірний токен');
      return NextResponse.json(
        { error: 'Невірний токен' },
        { status: 401 }
      );
    }

    // Перевірка що користувач оновлює свій профіль
    if (payload.userId !== userId) {
      console.error('[PUT /api/profile] Користувач намагається оновити чужий профіль:', { 
        tokenUserId: payload.userId, 
        profileId: userId 
      });
      return NextResponse.json(
        { error: 'Немає прав на оновлення цього профілю' },
        { status: 403 }
      );
    }

    // Визначаємо тип контенту і парсимо тіло запиту (JSON або FormData)
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    } else {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }

    // Допоміжні перетворення типів
    const toInt = (v: any): number | null | undefined => {
      if (v === undefined) return undefined;
      if (v === null || v === '') return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };
    const toBool = (v: any): boolean | undefined => {
      if (v === undefined) return undefined;
      if (v === true || v === 'true' || v === '1') return true;
      if (v === false || v === 'false' || v === '0') return false;
      return undefined;
    };

    const errors: string[] = [];

    // Подготовка данных для обновления
    const updateData: any = {};

    // Основная информация
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.middleName !== undefined) updateData.middleName = body.middleName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;

    // Локация
    if (body.city !== undefined) updateData.city = body.city;
    if (body.region !== undefined) updateData.region = body.region;
    if (body.housingType !== undefined) updateData.housingType = body.housingType;
    if (body.livingSituation !== undefined) updateData.livingSituation = body.livingSituation;

    // Персональная информация
    if (body.gender !== undefined) updateData.gender = body.gender;
  if (body.age !== undefined) updateData.age = toInt(body.age);
  if (body.maritalStatus !== undefined) updateData.maritalStatus = body.maritalStatus;
  if (body.familyComposition !== undefined) updateData.familyComposition = body.familyComposition;
  if (body.childrenCount !== undefined) updateData.childrenCount = toInt(body.childrenCount);
  if (body.childrenAges !== undefined) {
    try {
      updateData.childrenAges = typeof body.childrenAges === 'string'
        ? JSON.parse(body.childrenAges)
        : body.childrenAges;
    } catch {
      errors.push('childrenAges повинні бути валідним JSON');
    }
  }
    if (body.bio !== undefined) updateData.bio = body.bio;

    // Транспорт
    {
      const v = toBool(body.hasCar);
      if (v !== undefined) updateData.hasCar = v;
    }
    if (body.carInfo !== undefined) updateData.carInfo = body.carInfo;
    if (body.otherTransport !== undefined) updateData.otherTransport = body.otherTransport;
    if (body.carServices !== undefined) {
      try {
        updateData.carServices = typeof body.carServices === 'string'
          ? JSON.parse(body.carServices)
          : body.carServices;
      } catch {
        errors.push('carServices повинні бути валідним JSON');
      }
    }

    // Профессиональная деятельность
    if (body.profession !== undefined) updateData.profession = body.profession;
    if (body.employmentStatus !== undefined) updateData.employmentStatus = body.employmentStatus;
    if (body.workplace !== undefined) updateData.workplace = body.workplace;
    
    // Освіта: підтримуємо як окремі поля (educationLevel, educationDetails) так і сумісне 'education'
    const enumValues = ['secondary','college','bachelor','master','doctorate'];
    if (body.educationLevel !== undefined) {
      const level = body.educationLevel === '' ? null : body.educationLevel;
      if (level && !enumValues.includes(level)) {
        errors.push('Невірний рівень освіти');
      } else {
        updateData.educationLevel = level;
      }
    }
    if (body.educationDetails !== undefined) {
      updateData.educationDetails = body.educationDetails === '' ? null : body.educationDetails;
    }
    // Сумісність зі старим фронтом: якщо передано 'education' і не передано нових полів
    if (body.education !== undefined && body.educationLevel === undefined && body.educationDetails === undefined) {
      const val = body.education === '' ? null : body.education;
      if (val === null) {
        updateData.educationLevel = null;
        updateData.educationDetails = null;
      } else if (enumValues.includes(val)) {
        updateData.educationLevel = val;
      } else {
        updateData.educationDetails = val;
      }
    }
    
    if (body.privateBusinessInfo !== undefined) updateData.privateBusinessInfo = body.privateBusinessInfo;
    if (body.jobSeeking !== undefined) updateData.jobSeeking = body.jobSeeking;
  if (body.seekingPartTime !== undefined) updateData.seekingPartTime = toBool(body.seekingPartTime);
  if (body.seekingFullTime !== undefined) updateData.seekingFullTime = toBool(body.seekingFullTime);
  if (body.wantsStartBusiness !== undefined) updateData.wantsStartBusiness = toBool(body.wantsStartBusiness);

    // Домашние животные
    {
      const v = toBool(body.hasPets);
      if (v !== undefined) updateData.hasPets = v;
    }
    if (body.petsInfo !== undefined) updateData.petsInfo = body.petsInfo;

    // Интересы и стиль жизни
    if (body.hobbies !== undefined) updateData.hobbies = body.hobbies;
    if (body.outdoorActivities !== undefined) updateData.outdoorActivities = body.outdoorActivities;
    if (body.lifestyle !== undefined) updateData.lifestyle = body.lifestyle;
    if (body.sports !== undefined) updateData.sports = body.sports;
    if (body.beautyServices !== undefined) {
      try {
        updateData.beautyServices = typeof body.beautyServices === 'string'
          ? JSON.parse(body.beautyServices)
          : body.beautyServices;
      } catch {
        errors.push('beautyServices повинні бути валідним JSON');
      }
    }

    // Соцсети
    if (body.socialLinks !== undefined) {
      if (typeof body.socialLinks === 'string') {
        try {
          updateData.socialLinks = JSON.parse(body.socialLinks);
        } catch {
          errors.push('socialLinks повинні бути валідним JSON');
        }
      } else {
        updateData.socialLinks = body.socialLinks;
      }
    }

    // Споживчі та сервісні переваги
    if (body.usesDelivery !== undefined) updateData.usesDelivery = toBool(body.usesDelivery);
    if (body.restaurantFrequency !== undefined) updateData.restaurantFrequency = body.restaurantFrequency;
    if (body.cuisinePreference !== undefined) updateData.cuisinePreference = body.cuisinePreference;
    if (body.usesServices !== undefined) {
      try {
        updateData.usesServices = typeof body.usesServices === 'string'
          ? JSON.parse(body.usesServices)
          : body.usesServices;
      } catch {
        errors.push('usesServices повинні бути валідним JSON');
      }
    }
    if (body.usesBusinessServices !== undefined) {
      try {
        updateData.usesBusinessServices = typeof body.usesBusinessServices === 'string'
          ? JSON.parse(body.usesBusinessServices)
          : body.usesBusinessServices;
      } catch {
        errors.push('usesBusinessServices повинні бути валідним JSON');
      }
    }
    if (body.readyToSwitchToUCM !== undefined) updateData.readyToSwitchToUCM = toBool(body.readyToSwitchToUCM);
    if (body.ucmMember !== undefined) updateData.ucmMember = toBool(body.ucmMember);
    if (body.ucmSupporter !== undefined) updateData.ucmSupporter = toBool(body.ucmSupporter);

    if (errors.length) {
      return NextResponse.json({ error: 'Невірні дані', details: errors }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Удаляем чувствительные данные перед отправкой
    const { passwordHash, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      message: 'Профіль оновлено!',
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
