# 🔄 Повне перевстановлення на VPS з нуля

## Крок 1: Видалити все старе на VPS

```bash
# З'єднатись з VPS
ssh root@vps-52355

# Зупинити PM2
pm2 delete all
pm2 kill

# Видалити старий проект
rm -rf /var/www/sviydlyasvoih/platform-svoi

# Видалити стару базу даних
sudo -u postgres psql -c "DROP DATABASE IF EXISTS sviydlyasvoyikh;"
sudo -u postgres psql -c "DROP USER IF EXISTS sviy;"

# Очистити логи Nginx
sudo rm -f /var/log/nginx/access.log
sudo rm -f /var/log/nginx/error.log
sudo systemctl restart nginx
```

---

## Крок 2: Створити базу даних заново

```bash
# Створити користувача PostgreSQL
sudo -u postgres psql << EOF
CREATE USER sviy WITH PASSWORD '228928228928';
ALTER USER sviy CREATEDB;
EOF

# Створити базу даних
sudo -u postgres psql << EOF
CREATE DATABASE sviydlyasvoyikh OWNER sviy;
GRANT ALL PRIVILEGES ON DATABASE sviydlyasvoyikh TO sviy;
EOF

# Перевірити що база створена
psql -U sviy -d sviydlyasvoyikh -c "SELECT 1;"
```

**Очікуємо:** `?column? \n ---------- \n 1`

---

## Крок 3: Клонувати проект заново

```bash
# Створити директорію
mkdir -p /var/www/sviydlyasvoih

# Перейти в директорію
cd /var/www/sviydlyasvoih

# Клонувати з GitHub
git clone https://github.com/denskkk/platform-svoi.git

# Перейти в проект
cd platform-svoi

# Перевірити що на правильній гілці
git branch
git status
```

---

## Крок 4: Створити .env файл

```bash
# Створити .env файл
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://sviy:228928228928@localhost:5432/sviydlyasvoyikh"

# NextAuth
NEXTAUTH_URL="http://sviydlyasvoih.com.ua"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production-12345678"

# JWT Secret (для генерації токенів)
JWT_SECRET="your-jwt-secret-key-change-this-in-production-87654321"

# App
NODE_ENV="production"
PORT=3000

# Upload directory
UPLOAD_DIR="/var/www/sviydlyasvoih/platform-svoi/public/uploads"
EOF

# Перевірити що файл створено
cat .env
```

---

## Крок 5: Встановити залежності

```bash
# Встановити Node.js залежності
npm install

# Згенерувати Prisma Client
npx prisma generate
```

**Очікуємо:** `✔ Generated Prisma Client`

---

## Крок 6: Застосувати міграції бази даних

```bash
# Застосувати всі міграції
npx prisma migrate deploy

# Якщо помилка - спробувати скинути і застосувати заново
# npx prisma migrate reset --force
# npx prisma migrate deploy
```

**Очікуємо:** Список застосованих міграцій без помилок

---

## Крок 7: Перевірити структуру бази даних

```bash
# Підключитись до бази
psql -U sviy -d sviydlyasvoyikh

# В PostgreSQL виконати:
\dt

# Має показати таблиці:
# users, services, business_info, categories, cities, favorites, messages, notifications, reports, reviews, search_logs, sessions

# Перевірити структуру таблиці users
\d users

# Вийти з PostgreSQL
\q
```

---

## Крок 8: Створити директорію для завантажень

```bash
# Створити директорію
mkdir -p /var/www/sviydlyasvoih/platform-svoi/public/uploads

# Встановити права
chmod -R 755 /var/www/sviydlyasvoih/platform-svoi/public/uploads
```

---

## Крок 9: Побудувати проект

```bash
# Перейти в директорію проекту
cd /var/www/sviydlyasvoih/platform-svoi

# Побудувати для production
npm run build
```

**Очікуємо:** `✓ Compiled successfully`

---

## Крок 10: Запустити через PM2

```bash
# Запустити додаток
pm2 start npm --name sviy-web -- start

# Перевірити статус
pm2 status

# Подивитись логи
pm2 logs sviy-web --lines 20
```

**Очікуємо:** 
- Status: `online`
- Логи: `✓ Ready in XXXms`

---

## Крок 11: Перевірити що працює

```bash
# Перевірити HTTP відповідь
curl http://localhost:3000

# Має повернути HTML код головної сторінки
```

**Якщо повертає HTML - все працює! ✅**

---

## Крок 12: Налаштувати Nginx

```bash
# Перевірити конфігурацію Nginx
cat /etc/nginx/sites-available/sviydlyasvoih.com.ua

# Якщо файлу немає - створити:
sudo nano /etc/nginx/sites-available/sviydlyasvoih.com.ua
```

**Вміст файлу (з прямою подачею статичних завантажень):**

```nginx
server {
    listen 80;
    server_name sviydlyasvoih.com.ua www.sviydlyasvoih.com.ua;

    # Максимальний розмір файлу для завантаження
    client_max_body_size 10M;

   # Статичні завантаження з диска (швидше і надійніше)
   location /uploads/ {
      alias /var/www/sviydlyasvoih/platform-svoi/public/uploads/;
      access_log off;
      expires 30d;
      add_header Cache-Control "public, max-age=31536000, immutable";
      try_files $uri $uri/ =404;
   }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймаути
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Після створення:**

```bash
# Створити симлінк
sudo ln -sf /etc/nginx/sites-available/sviydlyasvoih.com.ua /etc/nginx/sites-enabled/

# Видалити default конфіг якщо є
sudo rm -f /etc/nginx/sites-enabled/default

# Перевірити конфігурацію
sudo nginx -t

# Перезапустити Nginx
sudo systemctl restart nginx

# Перевірити статус
sudo systemctl status nginx
```

---

## Крок 13: Протестувати сайт

**Відкрити в браузері:**

1. **Головна сторінка:**  
   http://sviydlyasvoih.com.ua

2. **Реєстрація глядача:**  
   http://sviydlyasvoih.com.ua/auth/register/viewer

3. **Реєстрація бізнесу:**  
   http://sviydlyasvoih.com.ua/auth/register/business

---

## Крок 14: Тест реєстрації

### Тест 1: Зареєструвати глядача

1. Відкрити: http://sviydlyasvoih.com.ua/auth/register/viewer
2. Заповнити:
   - Ім'я: `Тест`
   - Прізвище: `Користувач`
   - Email: `test1@example.com`
   - Пароль: `Test1234`
   - Підтвердження: `Test1234`
3. Залишити порожніми: Телефон, Місто
4. Натиснути "Зареєструватися"

**Очікуємо:**
- ✅ Редірект на `/catalog`
- ✅ В DevTools → Application → Local Storage є `user` та `token`

### Тест 2: Зареєструвати бізнес

1. Відкрити: http://sviydlyasvoih.com.ua/auth/register/business
2. Заповнити:
   - Ім'я: `Олександр`
   - Email: `business1@example.com`
   - Телефон: `+380501234567`
   - Пароль: `Business1234`
3. Залишити порожнім: Місто
4. Натиснути "Продовжити"

**Очікуємо:**
- ✅ Редірект на `/auth/business-questionnaire`
- ✅ В Local Storage є `user` та `token`

---

## Крок 15: Перевірити в базі даних

```bash
# Підключитись до бази
psql -U sviy -d sviydlyasvoyikh

# Перевірити користувачів
SELECT id, "firstName", "lastName", email, role, city, "createdAt" FROM users ORDER BY "createdAt" DESC;

# Вийти
\q
```

**Має показати:**
- Двох нових користувачів (test1 та business1)
- city може бути NULL - це нормально

---

## Крок 16: Встановити SSL (після успішного тестування)

```bash
# Встановити Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Отримати сертифікат
sudo certbot --nginx -d sviydlyasvoih.com.ua -d www.sviydlyasvoih.com.ua

# Під час встановлення:
# - Ввести email
# - Погодитись з умовами
# - Обрати: Redirect HTTP to HTTPS (опція 2)

# Перевірити автопродовження
sudo certbot renew --dry-run
```

**Після SSL:**
- Сайт доступний на https://sviydlyasvoih.com.ua
- HTTP автоматично редіректить на HTTPS

---

## Крок 17: Налаштувати автозапуск PM2

```bash
# Зберегти конфігурацію PM2
pm2 save

# Налаштувати автозапуск
pm2 startup

# Виконати команду яку покаже pm2 startup
# Приклад:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

---

## 🎉 Готово!

### ✅ Що маємо:
- Чиста база даних PostgreSQL
- Свіжий клон проекту з GitHub
- Побудований production білд
- PM2 запущено та працює
- Nginx налаштовано
- Реєстрація працює (з опціональним містом)
- SSL сертифікат (якщо встановили)
- Автозапуск при перезавантаженні

---

## 🆘 Якщо щось пішло не так

### База даних не підключається:
```bash
# Перевірити що PostgreSQL працює
sudo systemctl status postgresql

# Перевірити підключення
psql -U sviy -d sviydlyasvoyikh -c "SELECT 1;"

# Перевірити пароль в .env
cat .env | grep DATABASE_URL
```

### PM2 показує помилки:
```bash
# Подивитись детальні логи
pm2 logs sviy-web --lines 50

# Перезапустити
pm2 restart sviy-web

# Якщо не допомагає - видалити і створити заново
pm2 delete sviy-web
pm2 start npm --name sviy-web -- start
```

### Nginx не працює:
```bash
# Перевірити конфігурацію
sudo nginx -t

# Подивитись логи помилок
sudo tail -f /var/log/nginx/error.log

# Перезапустити
sudo systemctl restart nginx
```

### Build не проходить:
```bash
# Очистити кеш
rm -rf .next node_modules package-lock.json

# Переустановити залежності
npm install

# Згенерувати Prisma
npx prisma generate

# Повторити build
npm run build
```

---

**Готові почати? Виконуйте команди по порядку, починаючи з Кроку 1!** 🚀
