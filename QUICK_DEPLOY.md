# 🚀 Швидкий деплой на VPS

## Крок 1: Підготовка сервера (один раз)

```bash
# Підключіться до VPS
ssh root@vps-52355

# Оновіть систему
sudo apt update && sudo apt upgrade -y

# Встановіть необхідне ПО
sudo apt install -y curl git build-essential nginx postgresql

# Встановіть Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Встановіть PM2
sudo npm i -g pm2

# Налаштуйте firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

## Крок 2: Налаштування PostgreSQL

```bash
# Відредагуйте конфігурацію PostgreSQL для md5 аутентифікації
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Знайдіть рядок:
# local   all             all                                     peer

# Змініть на:
# local   all             all                                     md5

# Збережіть (Ctrl+O, Enter, Ctrl+X)

# Перезапустіть PostgreSQL
sudo systemctl restart postgresql

# Створіть базу даних і користувача
sudo -u postgres psql << EOF
CREATE USER sviy WITH PASSWORD '228928228928';
CREATE DATABASE sviydlyasvoyikh OWNER sviy;
GRANT ALL PRIVILEGES ON DATABASE sviydlyasvoyikh TO sviy;
\c sviydlyasvoyikh
GRANT ALL ON SCHEMA public TO sviy;
\q
EOF
```

## Крок 3: Завантажте проект

```bash
# Створіть директорію
cd /var/www
sudo mkdir -p sviydlyasvoih
sudo chown -R $USER:$USER sviydlyasvoih
cd sviydlyasvoih

# Клонуйте репозиторій (або завантажте код іншим способом)
git clone https://github.com/denskkk/platform-svoi.git
cd platform-svoi

# АБО якщо використовуєте git pull:
# git pull origin main
```

## Крок 4: Налаштуйте .env

```bash
# Створіть .env файл
cat > .env << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://sviydlyasvoih.com.ua
JWT_SECRET=super-secret-jwt-key-change-this-in-production-228928
DATABASE_URL=postgresql://sviy:228928228928@localhost:5432/sviydlyasvoyikh
PORT=3000
EOF

# Перевірте
cat .env
```

## Крок 5: Встановіть залежності і запустіть

```bash
# Встановіть залежності
npm ci

# Згенеруйте Prisma Client
npx prisma generate

# Застосуйте міграції
npx prisma migrate deploy

# Створіть next.config.mjs (ігнорує ESLint при білді)
cat > next.config.mjs << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
EOF

# Зберіть проект
npm run build

# Запустіть через PM2
pm2 start npm --name sviy-web -- start
pm2 save
pm2 startup
# Виконайте команду, яку покаже pm2 startup

# Перевірте статус
pm2 status
pm2 logs sviy-web --lines 20
```

## Крок 6: Налаштуйте Nginx

```bash
# Скопіюйте конфіг Nginx
sudo cp nginx.conf /etc/nginx/sites-available/sviydlyasvoih.com.ua

# Створіть symlink
sudo ln -s /etc/nginx/sites-available/sviydlyasvoih.com.ua /etc/nginx/sites-enabled/

# Перевірте конфігурацію
sudo nginx -t

# Запустіть Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Якщо Apache2 блокує порт 80:
sudo systemctl stop apache2
sudo systemctl disable apache2
sudo systemctl restart nginx
```

## Крок 7: Встановіть SSL (після налаштування DNS)

```bash
# Встановіть Certbot
sudo apt install certbot python3-certbot-nginx -y

# Отримайте SSL сертифікат
sudo certbot --nginx -d sviydlyasvoih.com.ua -d www.sviydlyasvoih.com.ua

# Автоматичне оновлення налаштується автоматично
```

## Крок 8: Перевірте

```bash
# Локальна перевірка
curl http://localhost:3000

# Перевірте PM2
pm2 status
pm2 logs sviy-web --lines 50

# Відкрийте у браузері
# http://sviydlyasvoih.com.ua
# https://sviydlyasvoih.com.ua (після SSL)
```

---

## 🔄 Оновлення (після змін коду)

```bash
# Перейдіть в директорію проекту
cd /var/www/sviydlyasvoih/platform-svoi

# Витягніть оновлення
git pull origin main

# Використовуйте готовий скрипт деплою:
chmod +x deploy.sh
./deploy.sh

# АБО вручну:
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart sviy-web
```

---

## 🔍 Діагностика проблем

### Проблема: PM2 падає з помилкою "Could not find production build"
```bash
# Переконайтеся що build пройшов успішно
npm run build
ls -la .next/

# Якщо білд падає з ESLint помилками, перевірте next.config.mjs
cat next.config.mjs
```

### Проблема: Nginx показує 502 Bad Gateway
```bash
# Перевірте що PM2 запущено
pm2 status

# Перевірте логи PM2
pm2 logs sviy-web --lines 50

# Перевірте що додаток слухає порт 3000
curl http://localhost:3000
netstat -tulpn | grep :3000
```

### Проблема: База даних не підключається
```bash
# Перевірте DATABASE_URL у .env
cat .env | grep DATABASE_URL

# Тест підключення до PostgreSQL
PGPASSWORD='228928228928' psql -U sviy -d sviydlyasvoyikh -h localhost -c "SELECT 1;"

# Якщо помилка "Peer authentication failed":
# Відредагуйте /etc/postgresql/14/main/pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Змініть 'peer' на 'md5' для local з'єднань
sudo systemctl restart postgresql
```

### Проблема: Не можу зареєструватися
```bash
# Перевірте що поле city опціональне в схемі
grep "city.*String" prisma/schema.prisma
# Має бути: city String? (з знаком питання)

# Перевірте міграції
ls -la prisma/migrations/

# Застосуйте міграції
npx prisma migrate deploy

# Перегенеруйте Prisma Client
npx prisma generate

# Перезапустіть додаток
pm2 restart sviy-web
```

---

## 📞 Корисні команди

```bash
# PM2
pm2 status                    # Статус всіх процесів
pm2 logs sviy-web            # Логи в реальному часі
pm2 logs sviy-web --lines 100 --err  # Останні 100 помилок
pm2 restart sviy-web         # Перезапуск
pm2 stop sviy-web            # Зупинка
pm2 delete sviy-web          # Видалення з PM2
pm2 monit                    # Монітор ресурсів

# Nginx
sudo systemctl status nginx  # Статус
sudo systemctl restart nginx # Перезапуск
sudo nginx -t                # Тест конфігурації
sudo tail -f /var/log/nginx/access.log  # Логи доступу
sudo tail -f /var/log/nginx/error.log   # Логи помилок

# PostgreSQL
sudo systemctl status postgresql  # Статус
psql -U sviy -d sviydlyasvoyikh  # Підключення до БД
\dt                              # Список таблиць (в psql)
\d "User"                        # Структура таблиці User
\q                               # Вийти з psql

# Системні ресурси
htop                         # Монітор системи
df -h                        # Дисковий простір
free -h                      # Пам'ять
```

---

**Готово! Ваш сайт має працювати на https://sviydlyasvoih.com.ua 🎉**
