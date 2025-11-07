/**
 * POST /api/auth/register
 * Реєстрація нового користувача
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
      lastName, 
      email, 
      password, 
      phone, 
      city, 
      role = 'user',
      accountType = 'basic',
    } = body;

    // Валідація обов'язкових полів
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Заповніть всі обов\'язкові поля' },
        { status: 400 }
      );
    }

    // Валідація accountType
    const validAccountTypes = ['guest', 'basic', 'extended'];
    if (!validAccountTypes.includes(accountType)) {
      return NextResponse.json(
        { error: 'Невірний тип акаунту' },
        { status: 400 }
      );
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
    // Trial: first 3 months free for paid plans (extended)
    const now = new Date();
    const trialExpires = new Date(now);
    trialExpires.setMonth(trialExpires.getMonth() + 3);

    const user = await prisma.user.create({
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
        // apply free trial for non-basic plans
        subscriptionActive: accountType !== 'basic',
        subscriptionStartedAt: accountType !== 'basic' ? now : null,
        subscriptionExpiresAt: accountType !== 'basic' ? trialExpires : null,
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

    // Генерація JWT токена
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Створення сесії
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 днів

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: token,
        expiresAt,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    });

    // Створити відповідь з токеном в JSON для клієнта
    const response = NextResponse.json({
      success: true,
      message: accountType === 'extended' 
        ? 'Розширений акаунт успішно створено!' 
        : 'Реєстрація успішна!',
      user,
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
