import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { checkRateLimit } from '@/lib/rateLimit';
import { getAuthCookie } from '@/lib/cookies';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 завантажень на годину
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    const rateLimit = checkRateLimit(`upload:${ip}`, {
      interval: 60 * 60 * 1000, // 1 година
      maxRequests: 10
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Занадто багато завантажень. Спробуйте через годину.',
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

    // Проверка авторизации - спочатку cookie, потім header
    let token = getAuthCookie(request);
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизовано' },
        { status: 401 }
      );
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { error: 'Невалідний токен' },
        { status: 401 }
      );
    }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const rawType = (formData.get('type') as string) || 'avatars';
  const allowedDirs = new Set(['avatars', 'logos', 'services', 'misc']);
  const safeDir = allowedDirs.has(rawType) ? rawType : 'avatars';
    
    if (!file) {
      return NextResponse.json(
        { error: 'Файл не знайдено' },
        { status: 400 }
      );
    }

    // Валідація типу файлу (тільки безпечні формати зображень)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Дозволені тільки зображення: JPG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Валідація розміру файлу (максимум 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Файл занадто великий. Максимум 5MB' },
        { status: 400 }
      );
    }

    // Валідація назви файлу (захист від path traversal)
    const originalName = file.name;
    if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
      return NextResponse.json(
        { error: 'Некоректна назва файлу' },
        { status: 400 }
      );
    }

    // Создаем уникальное имя файла
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const timestamp = Date.now();
  const filename = `${safeDir.slice(0, -1)}-${timestamp}.webp`; // name prefix from type; зберігаємо як WebP
    
    // Путь к папке uploads
  const uploadsDir = join(process.cwd(), 'public', 'uploads', safeDir);
    
    // Создаем папку если не существует
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Оптимізуємо зображення:
    // - Resize до 400x400 (достатньо для аватарів)
    // - Конвертуємо в WebP (краща компресія ніж JPEG/PNG)
    // - Якість 85% (баланс між розміром та якістю)
    const optimizedBuffer = await sharp(buffer)
      .resize(400, 400, {
        fit: 'cover', // Обрізає зображення щоб заповнити квадрат
        position: 'center'
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Сохраняем оптимізований файл
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, optimizedBuffer);
    
    // Лог розміру до/після оптимізації
    const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const optimizedSizeMB = (optimizedBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`[Upload] Оптимізовано: ${originalSizeMB}MB → ${optimizedSizeMB}MB`);
    
    // Возвращаем URL файла
  const url = `/uploads/${safeDir}/${filename}`;
    
    return NextResponse.json({
      success: true,
      url: url,
      filename: filename,
      optimized: {
        originalSize: file.size,
        optimizedSize: optimizedBuffer.length,
        savings: `${((1 - optimizedBuffer.length / file.size) * 100).toFixed(1)}%`
      }
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Помилка завантаження файлу' },
      { status: 500 }
    );
  }
}
