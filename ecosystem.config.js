// ============================================
// PM2 ECOSYSTEM КОНФИГУРАЦИЯ
// ============================================
// Использование: pm2 start ecosystem.config.js
// Или: pm2 reload ecosystem.config.js

module.exports = {
  apps: [
    {
      // Название приложения в PM2
      name: 'sviy-platform',
      
      // Команда запуска
      script: 'npm',
      args: 'start',
      
      // Директория проекта
  // Корневая папка проекта (где лежит package.json)
  cwd: '/var/www/sviydlyasvoih/platform-svoi',
      
      // Переменные окружения
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Подключение .env файла (убедитесь что путь верный)
      // Создайте файл /var/www/sviydlyasvoih/platform-svoi/.env если его нет
      env_file: '/var/www/sviydlyasvoih/platform-svoi/.env',
      
      // Количество инстансов (1 = один процесс)
      // Можно указать 'max' для использования всех CPU ядер
      instances: 1,
      
      // Режим работы: fork или cluster
      exec_mode: 'fork',
      
      // Автоматический перезапуск при падении
      autorestart: true,
      
      // Максимум перезапусков за минуту
      max_restarts: 10,
      
      // Минимальное время работы перед считанием перезапуска
      min_uptime: '10s',
      
      // Использование watch (не рекомендуется для production)
      watch: false,
      
      // Максимальное использование памяти (перезапуск при превышении)
      max_memory_restart: '500M',
      
      // Логи
      error_file: '/var/www/sviydlyasvoih/platform-svoi/logs/error.log',
      out_file: '/var/www/sviydlyasvoih/platform-svoi/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Объединение логов из всех инстансов
      merge_logs: true,
      
      // Время ожидания перед форс-килом при рестарте (мс)
      kill_timeout: 5000,
      
      // Задержка между рестартами (мс)
      restart_delay: 1000,
    }
  ],
  
  // Настройки деплоя (опционально, для автоматизации)
  deploy: {
    production: {
      // SSH пользователь
      user: 'root',
      
      // Хост сервера
      host: 'sviydlyasvoih.com.ua',
      
      // SSH порт
      port: 22,
      
      // Ветка Git
      ref: 'origin/main',
      
      // Git репозиторий
      repo: 'git@github.com:USERNAME/platform.git',
      
      // Путь на сервере
      path: '/var/www/sviydlyasvoih',
      
      // Команды после деплоя
      'post-deploy': 'npm ci && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.js',
      
      // Переменные окружения
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
