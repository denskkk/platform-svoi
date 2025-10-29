/**
 * Простий load test для перевірки 100+ одночасних користувачів
 * Використання: node loadtest.js
 */

const API_URL = 'http://localhost:3000';
const CONCURRENT_USERS = 100;
const REQUESTS_PER_USER = 5;

// Функція для виконання одного запиту
async function makeRequest(userId) {
  const endpoints = [
    '/api/health',
    '/api/services?page=1&limit=10',
    '/api/services?city=Київ',
    '/api/categories',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    const duration = Date.now() - startTime;
    
    return {
      success: response.ok,
      status: response.status,
      duration,
      endpoint,
      userId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
      endpoint,
      userId,
    };
  }
}

// Симулюємо одного користувача
async function simulateUser(userId) {
  const results = [];
  
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const result = await makeRequest(userId);
    results.push(result);
    
    // Невелика затримка між запитами (симуляція реального користувача)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
  }
  
  return results;
}

// Головна функція load test
async function runLoadTest() {
  console.log('🚀 Запуск load test...');
  console.log(`👥 Користувачів: ${CONCURRENT_USERS}`);
  console.log(`📊 Запитів на користувача: ${REQUESTS_PER_USER}`);
  console.log(`📈 Всього запитів: ${CONCURRENT_USERS * REQUESTS_PER_USER}\n`);

  const startTime = Date.now();

  // Запускаємо всіх користувачів одночасно
  const userPromises = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i));
  }

  const allResults = await Promise.all(userPromises);
  const flatResults = allResults.flat();

  const totalDuration = Date.now() - startTime;

  // Аналіз результатів
  const successful = flatResults.filter(r => r.success).length;
  const failed = flatResults.filter(r => !r.success).length;
  const durations = flatResults.map(r => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  // Підрахунок запитів за статусом
  const statusCounts = {};
  flatResults.forEach(r => {
    if (r.status) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }
  });

  // Виведення результатів
  console.log('\n📊 РЕЗУЛЬТАТИ LOAD TEST:');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Успішних запитів: ${successful} (${(successful / flatResults.length * 100).toFixed(1)}%)`);
  console.log(`❌ Невдалих запитів: ${failed} (${(failed / flatResults.length * 100).toFixed(1)}%)`);
  console.log(`⏱️  Загальний час: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`📈 RPS (requests/sec): ${(flatResults.length / (totalDuration / 1000)).toFixed(2)}`);
  console.log('\n⏰ ЧАС ВІДПОВІДІ:');
  console.log(`   Середній: ${avgDuration.toFixed(0)}ms`);
  console.log(`   Мінімальний: ${minDuration}ms`);
  console.log(`   Максимальний: ${maxDuration}ms`);
  
  console.log('\n📋 HTTP СТАТУСИ:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count} запитів`);
  });

  // Оцінка готовності
  console.log('\n🎯 ОЦІНКА:');
  if (failed === 0 && avgDuration < 1000) {
    console.log('   ✅ ВІДМІННО! Платформа готова для 100+ користувачів');
  } else if (failed < flatResults.length * 0.05 && avgDuration < 2000) {
    console.log('   ⚠️  ДОБРЕ, але є простір для покращення');
  } else {
    console.log('   ❌ ПОТРЕБУЄ ОПТИМІЗАЦІЇ');
  }

  // Помилки (якщо є)
  if (failed > 0) {
    console.log('\n❌ ПОМИЛКИ:');
    flatResults
      .filter(r => !r.success)
      .slice(0, 5)
      .forEach(r => {
        console.log(`   ${r.endpoint}: ${r.error || `Status ${r.status}`}`);
      });
    if (failed > 5) {
      console.log(`   ... та ще ${failed - 5} помилок`);
    }
  }
}

// Запуск
runLoadTest().catch(console.error);
