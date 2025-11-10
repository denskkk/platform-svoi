/**
 * POST /api/upload/business-images
 * Завантаження логотипу та банера компанії
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const logo = formData.get('logo') as File | null;
    const banner = formData.get('banner') as File | null;

    if (!logo && !banner) {
      return NextResponse.json(
        { error: 'Не надано жодного файлу для завантаження' },
        { status: 400 }
      );
    }

    const uploadResults: { logoUrl?: string; bannerUrl?: string } = {};

    // Створити директорії, якщо їх не існує
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const logosDir = path.join(uploadsDir, 'logos');
    const bannersDir = path.join(uploadsDir, 'banners');

    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    if (!existsSync(logosDir)) {
      await mkdir(logosDir, { recursive: true });
    }
    if (!existsSync(bannersDir)) {
      await mkdir(bannersDir, { recursive: true });
    }

    // Обробка логотипу
    if (logo) {
      // Валідація файлу
      if (!logo.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Логотип має бути зображенням' },
          { status: 400 }
        );
      }

      // Максимальний розмір 5MB
      if (logo.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Розмір логотипу не повинен перевищувати 5MB' },
          { status: 400 }
        );
      }

      // Генерація унікального імені файлу
      const timestamp = Date.now();
      const ext = logo.name.split('.').pop();
      const fileName = `logo_${timestamp}.${ext}`;
      const filePath = path.join(logosDir, fileName);

      // Збереження файлу
      const bytes = await logo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      uploadResults.logoUrl = `/uploads/logos/${fileName}`;
    }

    // Обробка банера
    if (banner) {
      // Валідація файлу
      if (!banner.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Банер має бути зображенням' },
          { status: 400 }
        );
      }

      // Максимальний розмір 10MB для банера
      if (banner.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Розмір банера не повинен перевищувати 10MB' },
          { status: 400 }
        );
      }

      // Генерація унікального імені файлу
      const timestamp = Date.now();
      const ext = banner.name.split('.').pop();
      const fileName = `banner_${timestamp}.${ext}`;
      const filePath = path.join(bannersDir, fileName);

      // Збереження файлу
      const bytes = await banner.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      uploadResults.bannerUrl = `/uploads/banners/${fileName}`;
    }

    return NextResponse.json({
      success: true,
      message: 'Зображення успішно завантажені',
      ...uploadResults,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Помилка при завантаженні зображень' },
      { status: 500 }
    );
  }
}

// Конфігурація для Next.js 14
export const config = {
  api: {
    bodyParser: false,
  },
};
