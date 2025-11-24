/**
 * POST /api/auth/register-business
 * Реєстрація бізнес користувача (Business або Business Premium)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserReferralCode, awardReferral } from '@/lib/ucm';
import { hashPassword, generateToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { setAuthCookie } from '@/lib/cookies';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 реєстрацій на IP за годину
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    
    const rateLimit = checkRateLimit(`register-business:${ip}`, {
      interval: 60 * 60 * 1000, // 1 година
      maxRequests: 5
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Занадто багато спроб реєстрації. Спробуйте через годину.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const body = await request.json();
    const { user: userData, business: businessData } = body;

    // Валідація структури запиту
    if (!userData || !businessData) {
      return NextResponse.json(
        { error: 'Невірний формат запиту. Потрібні дані користувача та бізнесу' },
        { status: 400 }
      );
    }

    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      city, 
      role = 'business',
      accountType = 'business',
      ref,
      referralCode,
    } = userData;

    const {
      companyName,
      companyCode,
      businessCategory,
      companyType,
      offerType,
      description,
      website,
      seekingPartner,
      seekingInvestor,
      seekingCustomer,
      seekingEmployee,
      offerToCustomers,
      offerToPartners,
      offerToInvestors,
      wantsUCMAnalysis,
      // Нові детальні поля
      partnerSearchDetails,
      investorSearchDetails,
      customerSearchDetails,
      employeeVacancies,
      logoUrl,
      bannerUrl
    } = businessData;

    // Валідація обов'язкових полів користувача
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Заповніть всі обов\'язкові особисті дані' },
        { status: 400 }
      );
    }

    // Валідація обов'язкових полів бізнесу
    if (!companyName) {
      return NextResponse.json(
        { error: 'Вкажіть назву компанії' },
        { status: 400 }
      );
    }

    // Дозволяємо тільки звичайний бізнес акаунт (преміум прибрано)
    if (accountType !== 'business') {
      return NextResponse.json({ error: 'Невірний тип бізнес акаунту' }, { status: 400 });
    }

    // Валідація email формату
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Некоректний формат email' },
        { status: 400 }
      );
    }

    // Валідація пароля (мінімум 6 символів для спрощення, як у формі)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль повинен містити мінімум 6 символів' },
        { status: 400 }
      );
    }

    // Перевірка чи email вже існує
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Користувач з таким email вже існує' },
        { status: 409 }
      );
    }

    // Хешування пароля
    const passwordHash = await hashPassword(password);

    // Створення користувача та бізнесу в транзакції
    const result = await prisma.$transaction(async (tx: any) => {
      const cookieRef = request.cookies.get('ref')?.value;
      const refCode = referralCode || ref || request.nextUrl.searchParams.get('ref') || cookieRef || undefined;
      const inviter = refCode
        ? await tx.user.findFirst({ where: { referralCode: { equals: String(refCode), mode: 'insensitive' } }, select: { id: true, email: true } })
        : null;
      // Створення користувача
      const user = await tx.user.create({
        data: {
          role,
          accountType,
          firstName,
          lastName,
          email,
          phone: phone || null,
          city: city || null,
          passwordHash,
          isVerified: false,
          // підписка вимкнена — оплата лише за внутрішні функції
          subscriptionActive: false,
          subscriptionStartedAt: null,
          subscriptionExpiresAt: null,
          referredById: inviter && inviter.email !== email ? inviter.id : null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          accountType: true,
          city: true,
          avatarUrl: true,
          isVerified: true,
          subscriptionActive: true,
          subscriptionStartedAt: true,
          subscriptionExpiresAt: true,
          createdAt: true,
        }
      });

      // Генеруємо власний реф-код
      await ensureUserReferralCode(user.id)

      // Створення бізнес інформації
      console.log('[Register Business API] Створення бізнес профілю з даними:', {
        companyName,
        logoUrl,
        bannerUrl,
      });

      const business = await tx.businessInfo.create({
        data: {
          userId: user.id,
          companyName,
          companyCode: companyCode || null,
          city: city || null,
          businessCategory: businessCategory || null,
          companyType: companyType || null,
          offerType: offerType || null,
          description: description || null,
          website: website || null,
          phone: phone || null,
          email: email,
          seekingPartner: seekingPartner || false,
          seekingInvestor: seekingInvestor || false,
          seekingCustomer: seekingCustomer || false,
          seekingEmployee: seekingEmployee || false,
          // Преміум функції вимкнено
          offerToCustomers: false,
          offerToPartners: false,
          offerToInvestors: false,
          wantsUCMAnalysis: false,
          // Детальна інформація пошуку
          partnerSearchDetails: partnerSearchDetails || {},
          investorSearchDetails: investorSearchDetails || {},
          customerSearchDetails: customerSearchDetails || {},
          employeeVacancies: employeeVacancies || [],
          // Зображення
          logoUrl: logoUrl || null,
          bannerUrl: bannerUrl || null,
        },
        select: {
          id: true,
          companyName: true,
          companyCode: true,
          businessCategory: true,
          companyType: true,
          seekingPartner: true,
          seekingInvestor: true,
          seekingCustomer: true,
          seekingEmployee: true,
          offerToCustomers: true,
          offerToPartners: true,
          offerToInvestors: true,
          wantsUCMAnalysis: true,
          createdAt: true,
        }
      });

      // Нарахувати реф-бонус після створення всього
      if (inviter && inviter.email !== email) {
        await awardReferral({ inviterId: inviter.id, inviteeId: user.id, code: String(refCode) })
      }

      return { user, business };
    });

    // Генерація JWT токена
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      accountType: result.user.accountType,
    });

    // Створення сесії
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 днів

    await prisma.session.create({
      data: {
        userId: result.user.id,
        tokenHash: token,
        expiresAt,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    });

    // Створити відповідь з токеном в JSON для клієнта
    const response = NextResponse.json({
      success: true,
      message: 'Бізнес акаунт успішно створено!',
      user: {
        ...result.user,
        businessInfo: result.business
      },
      token,
    }, { status: 201 });

    // ТАКОЖ зберегти токен в httpOnly cookie для безпеки
    setAuthCookie(response, token);

    // Очистити cookie `ref` якщо він був встановлений при редіректі
    try {
      response.cookies.set('ref', '', { path: '/', maxAge: 0 });
    } catch (e) {
      // ignore
    }

    return response;

  } catch (error) {
    console.error('Business registration error:', error);
    
    // Детальніше логування для відладки
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Помилка сервера при реєстрації бізнесу' },
      { status: 500 }
    );
  }
}
