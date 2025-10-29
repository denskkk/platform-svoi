/**
 * Request timeout middleware
 * Запобігає зависанню запитів (важливо для 100+ користувачів)
 */

import { NextRequest, NextResponse } from 'next/server';

const REQUEST_TIMEOUT = 30000; // 30 секунд

/**
 * Обгортка для API handlers з timeout
 */
export function withTimeout(
  handler: (req: NextRequest) => Promise<NextResponse>,
  timeout: number = REQUEST_TIMEOUT
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    return Promise.race([
      handler(request),
      new Promise<NextResponse>((_, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout')),
          timeout
        )
      ),
    ]).catch((error) => {
      console.error('[Timeout] Request exceeded time limit:', error);
      return NextResponse.json(
        { 
          error: 'Запит занадто довго виконувався. Спробуйте пізніше.',
          timeout: true 
        },
        { status: 504 } // Gateway Timeout
      );
    });
  };
}

/**
 * Приклад використання:
 * 
 * export async function GET(request: NextRequest) {
 *   return withTimeout(async (req) => {
 *     // ... ваш код
 *     return NextResponse.json({ data: '...' });
 *   })(request);
 * }
 */
