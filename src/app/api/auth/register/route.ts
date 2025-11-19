/**
 * POST /api/auth/register
 * Реєстрація нового користувача
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
    
    const rateLimit = checkRateLimit(`register:${ip}`, {
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
    const { 
      firstName,
      middleName,
      lastName, 
      email, 
      password, 
      phone, 
      city, 
      role = 'user',
      accountType = 'basic',
      educationLevel,
      educationDetails,
      ucmMember,
      ucmSupporter,
      employmentStatus,
      ref,
      referralCode,
    } = body;

    // Валідація обов'язкових полів
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Заповніть всі обов\'язкові поля' },
        { status: 400 }
      );
    }

    // Дозволяємо тільки базовий безкоштовний акаунт (розширені та преміум прибрані)
    const validAccountTypes = ['basic'];
    if (!validAccountTypes.includes(accountType)) {
      return NextResponse.json({ error: 'Невірний тип акаунту' }, { status: 400 });
    }

    // Валідація email формату
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Некоректний формат email' },
        { status: 400 }
      );
    }

    // Валідація пароля (мінімум 6 символів для всіх типів)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль має містити мінімум 6 символів' },
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

  // Створення користувача з усіма полями
  const now = new Date();

    // Convert boolean values to strings for ucmMember and ucmSupporter
    const convertToYesNo = (value: any): string | null => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'boolean') return value ? 'Так' : 'Ні';
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'yes' || value === 'Так') return 'Так';
        if (value.toLowerCase() === 'no' || value === 'Ні') return 'Ні';
      }
      return null;
    };

    // Визначимо інвайтера за рефкодом, якщо передано
    const refCode = referralCode || ref || request.nextUrl.searchParams.get('ref') || undefined as any;
    const inviter = refCode
      ? await prisma.user.findFirst({ where: { referralCode: String(refCode) }, select: { id: true, email: true } })
      : null;

    // Створимо користувача у транзакції (реферальні дії виконаємо після commit)
    const created = await prisma.$transaction(async (tx: typeof prisma) => {
      const newUser = await tx.user.create({
        data: {
          role,
          accountType,
          firstName,
          middleName: middleName || null,
          lastName,
          email,
          phone: phone || null,
          city: city || null,
          passwordHash,
          isVerified: false,
          educationLevel: educationLevel || null,
          educationDetails: educationDetails || null,
          ucmMember: convertToYesNo(ucmMember),
          ucmSupporter: convertToYesNo(ucmSupporter),
          employmentStatus: employmentStatus || null,
          // Підписки немає, все безкоштовно, оплата лише за внутрішні функції
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

      return newUser
    });

    // Після успішної транзакції генеруємо реф-код та нараховуємо бонуси (позатранзакційно)
    try {
      await ensureUserReferralCode(created.id);
      if (inviter && inviter.email !== email) {
        await awardReferral({ inviterId: inviter.id, inviteeId: created.id, code: String(refCode) });
      }
    } catch (e) {
      // Логуємо, але не блокуємо реєстрацію у випадку проблем з реферальною системою
      console.warn('[register] referral post-processing failed', e);
    }

    // Нарахувати стартовий бонус користувачу (наприклад 5 уцмок) та записати транзакцію
    const START_BONUS = 5;
    try {
      await prisma.$transaction(async (tx: typeof prisma) => {
        await tx.user.update({ where: { id: created.id }, data: { balanceUcm: { increment: START_BONUS } } });
        await tx.ucmTransaction.create({
          data: {
            userId: created.id,
            kind: 'credit',
            amount: START_BONUS,
            reason: 'signup_bonus',
            relatedEntityType: null,
            relatedEntityId: null,
            meta: {},
          }
        });
      });
    } catch (e) {
      console.warn('[register] failed to apply start bonus', e);
    }

    // Підтягнемо оновлені дані користувача (щоб повернути balanceUcm) перед відправкою відповіді
    const returnedUser = await prisma.user.findUnique({
      where: { id: created.id },
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
        balanceUcm: true,
      }
    });

    // Генерація JWT токена
    const token = generateToken({
      userId: created.id,
      email: created.email,
      role: created.role,
      accountType: created.accountType,
    });

    // Створення сесії
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 днів

    await prisma.session.create({
      data: {
        userId: created.id,
        tokenHash: token,
        expiresAt,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    });

    // Створити відповідь з токеном в JSON для клієнта
    const response = NextResponse.json({
      success: true,
      message: 'Реєстрація успішна!',
      user: returnedUser || created,
      token,
    }, { status: 201 });

    // ТАКОЖ зберегти токен в httpOnly cookie для безпеки
    setAuthCookie(response, token);

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
