/**
 * POST /api/auth/login
 * Вхід користувача
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { setAuthCookie } from '@/lib/cookies';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 спроб логіну на IP за 15 хвилин
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    
    const rateLimit = checkRateLimit(`login:${ip}`, {
      interval: 15 * 60 * 1000, // 15 хвилин
      maxRequests: 10
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Занадто багато спроб входу. Спробуйте через 15 хвилин.',
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
    const { email, password } = body;

    // Валідація
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email та пароль обов\'язкові' },
        { status: 400 }
      );
    }

    // Знайти користувача
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Невірний email або пароль' },
        { status: 401 }
      );
    }

    // Перевірити пароль
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Невірний email або пароль' },
        { status: 401 }
      );
    }

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

    // Повернути користувача без пароля
    const { passwordHash, ...userWithoutPassword } = user;

    // Створити відповідь БЕЗ токена в JSON (токен буде в httpOnly cookie)
    const response = NextResponse.json({
      success: true,
      message: 'Вхід успішний!',
      user: userWithoutPassword,
      // НЕ повертаємо token в JSON - він буде в httpOnly cookie
    });

    // Зберегти токен в httpOnly cookie (безпечно від XSS атак)
    setAuthCookie(response, token);

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
