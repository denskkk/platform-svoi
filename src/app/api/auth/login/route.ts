/**
 * POST /api/auth/login
 * Вхід користувача
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { passwordMatches, passwordVariants } from '@/lib/auth';
import { getClientIp, peekRateLimit, checkRateLimit, resetRateLimit } from '@/lib/rateLimit';
import { setAuthCookie, setRefreshCookie } from '@/lib/cookies';
import { createSession } from '@/lib/session';

// Лічимо тільки НЕВДАЛІ спроби: успішні входи (і пристрої за спільним IP мобільного оператора)
// не повинні блокувати інших тестувальників.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_ACCOUNT = 10;
const MAX_FAILURES_PER_IP = 100;

function tooManyAttempts(resetTime: number) {
  const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
  return NextResponse.json(
    {
      error: `Занадто багато невдалих спроб входу. Спробуйте через ${Math.ceil(retryAfter / 60)} хв.`,
      retryAfter,
    },
    { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Некоректний запит' }, { status: 400 });
    }
    const { email, password } = body ?? {};

    // Валідація
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return NextResponse.json(
        { error: 'Email та пароль обов\'язкові' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim();
    const accountKey = `login:${ip}:${normalizedEmail.toLowerCase()}`;
    const ipKey = `login-ip:${ip}`;

    const accountLimit = peekRateLimit(accountKey, MAX_FAILURES_PER_ACCOUNT);
    if (accountLimit.limited) return tooManyAttempts(accountLimit.resetTime);
    const ipLimit = peekRateLimit(ipKey, MAX_FAILURES_PER_IP);
    if (ipLimit.limited) return tooManyAttempts(ipLimit.resetTime);

    const registerFailure = () => {
      checkRateLimit(accountKey, { interval: LOGIN_WINDOW_MS, maxRequests: MAX_FAILURES_PER_ACCOUNT });
      checkRateLimit(ipKey, { interval: LOGIN_WINDOW_MS, maxRequests: MAX_FAILURES_PER_IP });
    };

    const userSelect = {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        role: true,
        accountType: true,
        avatarUrl: true,
        city: true,
        isAdmin: true,
        isVerified: true,
        isActive: true,
    } as const;

    // Усі акаунти з цим email без урахування регістру (у старих даних можуть бути дублі
    // на кшталт Max@... і max@...): точний збіг перший, далі за id.
    const matches = (await prisma.user.findMany({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      select: userSelect,
      take: 5,
    })).sort((a: any, b: any) =>
      Number(b.email === normalizedEmail) - Number(a.email === normalizedEmail) || a.id - b.id
    );

    // Мобільні клавіатури додають пробіл після підказки або міняють регістр першої літери,
    // тому після точного пароля пробуємо ще кілька безпечних варіантів.
    const passwordCandidates = passwordVariants(password);
    let user: (typeof matches)[number] | null = null;
    for (const candidate of matches) {
      if (await passwordMatches(passwordCandidates, candidate.passwordHash)) {
        user = candidate;
        break;
      }
    }

    if (!user || !user.isActive) {
      registerFailure();
      return NextResponse.json(
        { error: 'Невірний email або пароль' },
        { status: 401 }
      );
    }

    resetRateLimit(accountKey);

    const { token, refreshToken } = await createSession(
      { id: user.id, email: user.email, role: user.role, accountType: user.accountType },
      request
    );

    // Повернути користувача без пароля
    const { passwordHash, ...userWithoutPassword } = user;

    // Створити відповідь і ТАКОЖ повернути token в JSON для localStorage (для HTTP без SSL)
    const response = NextResponse.json({
      success: true,
      message: 'Вхід успішний!',
      user: userWithoutPassword,
      token,
    });

    // Зберегти токен в httpOnly cookie (безпечно від XSS атак)
    setAuthCookie(response, token);
    setRefreshCookie(response, refreshToken);

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
