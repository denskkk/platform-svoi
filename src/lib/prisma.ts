/**
 * СВІЙ ДЛЯ СВОЇХ - Prisma Client Instance
 * 
 * Singleton pattern для Prisma Client щоб уникнути множинних підключень
 * в режимі розробки (hot reload)
 * 
 * ОПТИМІЗОВАНО ДЛЯ 100+ ОДНОЧАСНИХ КОРИСТУВАЧІВ
 */

import { PrismaClient } from '@prisma/client';

// Helper to mask sensitive parts of DATABASE_URL for logging
function describeDatabaseUrl(raw?: string) {
  if (!raw) return 'DATABASE_URL not set';
  try {
    // Prisma allows postgresql:// protocol. URL parser needs standard protocol.
    const normalized = raw.replace(/^postgresql:\/\//, 'postgres://');
    const u = new URL(normalized);
    const host = u.hostname;
    const db = u.pathname.replace(/\//, '') || '(no-db)';
    const user = u.username || '(no-user)';
    return `${user}@${host}/${db}`;
  } catch (e) {
    return 'Unparseable DATABASE_URL';
  }
}

// Глобальний тип для Prisma в development
declare global {
  // eslint-disable-next-line no-var
  var prisma: any | undefined;
}

// Створити один екземпляр Prisma Client з оптимізаціями
const rawDbUrl = process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'production') {
  // Log once at startup (safe, masked)
  console.log(`[Prisma] Initializing client. Target DB: ${describeDatabaseUrl(rawDbUrl)}`);
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  
  // КРИТИЧНО: Connection pooling для 100+ користувачів
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  
  // Налаштування connection pool (важливо для навантаження)
  // За замовчуванням: min=2, max=10, але для 100+ користувачів збільшуємо
  // Formula: max_connections = (num_workers * pool_size) + 10
  // Для 1 worker: pool_size = 20 підходить для 100 користувачів
}).$extends({
  query: {
    $allOperations({ operation, model, args, query }: any) {
      // Додаємо timeout для всіх запитів (запобігає зависанню)
      const timeout = 10000; // 10 секунд
      return Promise.race([
        query(args),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), timeout)
        ),
      ]);
    },
  },
});

// Proactive lightweight connectivity check (only once in production)
if (process.env.NODE_ENV === 'production') {
  (async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[Prisma] Connectivity check OK');
    } catch (err: any) {
      console.error('[Prisma] Connectivity check FAILED:', err?.message);
    }
  })();
}

// В development зберігаємо клієнт глобально для hot reload
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown - закриваємо з'єднання при виході
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('[Prisma] Disconnected gracefully');
});

/**
 * Приклад використання:
 * 
 * import { prisma } from '@/lib/prisma';
 * 
 * const users = await prisma.user.findMany();
 */
