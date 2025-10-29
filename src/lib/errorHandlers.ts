/**
 * Глобальна обробка помилок
 * Запобігає падінню сервера при критичних помилках
 */

// Обробка необроблених Promise rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔴 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // НЕ падаємо, просто логуємо
});

// Обробка необроблених винятків
process.on('uncaughtException', (error) => {
  console.error('🔴 Uncaught Exception:', error);
  // Логуємо та продовжуємо (для production краще перезапустити через PM2)
});

// Graceful shutdown на SIGTERM (коли Docker/PM2 зупиняє процес)
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM signal received: closing HTTP server');
  // Дати часу завершити поточні запити (5 секунд)
  setTimeout(() => {
    console.log('⏱️  Forcing shutdown');
    process.exit(0);
  }, 5000);
});

// Graceful shutdown на SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('📴 SIGINT signal received: closing HTTP server');
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

console.log('✅ Error handlers registered');

export {};
