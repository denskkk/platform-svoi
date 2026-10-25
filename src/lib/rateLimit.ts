/**
 * Rate Limiting для захисту від DDOS атак
 * Обмежує кількість запитів з одного IP
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Очищення старих записів кожні 5 хвилин
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);
cleanupTimer.unref?.();

export interface RateLimitOptions {
  interval: number; // Інтервал в мілісекундах
  maxRequests: number; // Максимум запитів за інтервал
}

/**
 * Перевіряє чи IP не перевищив ліміт запитів
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {
    interval: 60 * 1000, // 1 хвилина за замовчуванням
    maxRequests: 100 // 100 запитів за хвилину
  }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  if (!store[key] || store[key].resetTime < now) {
    // Новий запис або скинути лічильник
    store[key] = {
      count: 1,
      resetTime: now + options.interval
    };
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: store[key].resetTime
    };
  }

  store[key].count++;

  const allowed = store[key].count <= options.maxRequests;
  const remaining = Math.max(0, options.maxRequests - store[key].count);

  return {
    allowed,
    remaining,
    resetTime: store[key].resetTime
  };
}

/**
 * Лише перевіряє ліміт, не збільшуючи лічильник
 * (щоб рахувати тільки невдалі спроби, наприклад при вході)
 */
export function peekRateLimit(
  identifier: string,
  maxRequests: number
): { limited: boolean; resetTime: number } {
  const entry = store[identifier];
  if (!entry || entry.resetTime < Date.now()) {
    return { limited: false, resetTime: 0 };
  }
  return { limited: entry.count >= maxRequests, resetTime: entry.resetTime };
}

export function resetRateLimit(identifier: string) {
  delete store[identifier];
}

/**
 * IP клієнта за reverse proxy. X-Real-IP виставляє nginx ($remote_addr), його не можна підробити;
 * X-Forwarded-For клієнт може доповнити сам, тому він лише запасний варіант.
 */
export function getClientIp(request: Request): string {
  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real.slice(0, 45);
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (forwarded || 'unknown').slice(0, 45);
}

/**
 * Middleware для Next.js API routes
 */
export function withRateLimit(
  handler: Function,
  options?: RateLimitOptions
) {
  return async (request: Request, ...args: any[]) => {
    // Отримуємо IP адресу
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    // Перевіряємо ліміт
    const { allowed, remaining, resetTime } = checkRateLimit(ip, options);

    if (!allowed) {
      const resetDate = new Date(resetTime);
      return new Response(
        JSON.stringify({
          error: 'Занадто багато запитів. Спробуйте пізніше.',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': options?.maxRequests.toString() || '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetDate.toISOString(),
            'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Додаємо заголовки rate limit до відповіді
    const response = await handler(request, ...args);
    
    if (response.headers) {
      response.headers.set('X-RateLimit-Limit', options?.maxRequests.toString() || '100');
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
    }

    return response;
  };
}
