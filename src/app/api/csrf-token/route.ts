/**
 * GET /api/csrf-token
 * Отримати CSRF токен для захисту форм
 */

import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';

export async function GET() {
  const token = generateCsrfToken();
  
  return NextResponse.json({
    csrfToken: token,
    expiresIn: 3600 // 1 година в секундах
  });
}
