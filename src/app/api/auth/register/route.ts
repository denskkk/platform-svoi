/**
 * POST /api/auth/register
 * Реєстрація нового користувача
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, hashToken } from '@/lib/auth';
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
      employmentStatus,
      avatarUrl,
      avatarBase64,
      socialLinks,
    } = body;

    // Валідація обов'язкових полів
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Заповніть всі обов\'язкові поля' },
        { status: 400 }
      );
    }

    // Дозволяємо базовий акаунт та акаунт глядача
    const validAccountTypes = ['basic', 'viewer'];
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

  // Обробка avatarBase64 якщо передано
  let finalAvatarUrl = avatarUrl;
  if (avatarBase64 && avatarBase64.startsWith('data:image/')) {
    try {
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const { existsSync } = await import('fs');
      const sharp = await import('sharp');
      
      // Витягуємо base64 дані
      const base64Data = avatarBase64.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Створюємо унікальне ім'я файлу
      const timestamp = Date.now();
      const filename = `avatar-${timestamp}.webp`;
      
      // Шлях до папки uploads
      const baseUploadsRoot = process.env.UPLOADS_DIR || join(process.cwd(), 'public', 'uploads');
      const uploadsDir = join(baseUploadsRoot, 'avatars');
      
      // Створюємо папку якщо не існує
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
      
      // Оптимізуємо зображення
      const optimizedBuffer = await sharp.default(buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 85 })
        .toBuffer();
      
      // Зберігаємо файл
      const filePath = join(uploadsDir, filename);
      await writeFile(filePath, optimizedBuffer);
      
      // Встановлюємо URL для БД
      finalAvatarUrl = `/uploads/avatars/${filename}`;
    } catch (err) {
      console.error('Error saving avatar:', err);
      // Продовжуємо реєстрацію без аватару
    }
  }

  // Створення користувача з усіма полями
  const now = new Date();

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
          avatarUrl: finalAvatarUrl || null,
          socialLinks: socialLinks ? socialLinks : null,
          passwordHash,
          isVerified: false,
          educationLevel: educationLevel || null,
          educationDetails: educationDetails || null,
          employmentStatus: employmentStatus || null,
          // Підписки немає, платформа безкоштовна
          subscriptionActive: false,
          subscriptionStartedAt: null,
          subscriptionExpiresAt: null,
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
        isAdmin: true,
        subscriptionActive: true,
        subscriptionStartedAt: true,
        subscriptionExpiresAt: true,
        createdAt: true,
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
        tokenHash: hashToken(token),
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
