// Швидкий тест health check
fetch('http://localhost:3000/api/health')
  .then(res => res.json())
  .then(data => {
    console.log('\n🏥 HEALTH CHECK RESULT:');
    console.log('═══════════════════════════════════════');
    console.log(`Status: ${data.status}`);
    console.log(`Database: ${data.database?.status} (${data.database?.responseTime})`);
    console.log(`Memory RSS: ${data.memory?.rss}`);
    console.log(`Uptime: ${data.uptime}`);
    console.log(`Node: ${data.nodeVersion}`);
    console.log('═══════════════════════════════════════\n');
    
    if (data.status === 'healthy') {
      console.log('✅ Сервер працює відмінно!\n');
    } else {
      console.log('❌ Виявлено проблеми!\n');
    }
  })
  .catch(err => {
    console.error('❌ Помилка підключення:', err.message);
    console.log('Переконайтеся що сервер запущений: npm run dev\n');
  });
