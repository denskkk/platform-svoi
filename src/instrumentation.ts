/**
 * Next.js Instrumentation
 * Завантажується при старті сервера (один раз)
 */

export async function register() {
  // Реєструємо глобальні error handlers
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/errorHandlers');
    // Ініціюємо раннє створення Prisma клієнта для перевірки конекту (production)
    if (process.env.NODE_ENV === 'production') {
      try {
        const { prisma } = await import('@/lib/prisma');
        // Легка перевірка (повторно не шкідливо — в prisma.ts вже є перевірка)
        await prisma.$queryRaw`SELECT 1`;
        console.log('[Instrumentation] Early Prisma connectivity OK');
      } catch (e: any) {
        console.error('[Instrumentation] Early Prisma connectivity FAILED:', e?.message);
      }
    }
  }
}
