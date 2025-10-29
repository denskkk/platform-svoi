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
    const { firstName, lastName, email, password, phone, city, role = 'user' } = body;

    // Валідація обов'язкових полів
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Заповніть всі обов\'язкові поля' },
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

    // Валідація пароля (мінімум 8 символів, має містити букви та цифри)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Пароль має містити мінімум 8 символів' },
        { status: 400 }
      );
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasLetter || !hasNumber) {
      return NextResponse.json(
        { error: 'Пароль має містити букви та цифри' },
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

    // Створення користувача
    const user = await prisma.user.create({
      data: {
        role,
        firstName,
        lastName,
        email,
        phone,
        city,
        passwordHash,
        isVerified: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        city: true,
        avatarUrl: true,
        isVerified: true,
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

    // Створити відповідь БЕЗ токена в JSON
    const response = NextResponse.json({
      success: true,
      message: 'Реєстрація успішна!',
      user,
      // НЕ повертаємо token в JSON
    }, { status: 201 });

    // Зберегти токен в httpOnly cookie (безпечно від XSS атак)
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
