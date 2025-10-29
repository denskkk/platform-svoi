/**
 * Next.js Instrumentation
 * Завантажується при старті сервера (один раз)
 */

export async function register() {
  // Реєструємо глобальні error handlers
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/errorHandlers');
  }
}
