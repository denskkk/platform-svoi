# 🚀 Полное руководство по деплою на VPS

**Платформа:** Свій для Своїх  
**Домен:** sviydlyasvoih.com.ua  
**Сервер:** Ubuntu 20.04/22.04

---

## 📋 Содержание

1. [Подготовка сервера](#1-подготовка-сервера)
2. [Настройка DNS](#2-настройка-dns)
3. [Установка Node.js и PM2](#3-установка-nodejs-и-pm2)
4. [Установка PostgreSQL](#4-установка-postgresql)
5. [Установка Nginx](#5-установка-nginx)
6. [Загрузка проекта](#6-загрузка-проекта)
7. [Настройка переменных окружения](#7-настройка-переменных-окружения)
8. [База данных и миграции](#8-база-данных-и-миграции)
9. [Сборка и запуск приложения](#9-сборка-и-запуск-приложения)
10. [Настройка Nginx reverse proxy](#10-настройка-nginx-reverse-proxy)
11. [SSL сертификат (HTTPS)](#11-ssl-сертификат-https)
12. [Проверка работы](#12-проверка-работы)
13. [Обновление приложения](#13-обновление-приложения)
14. [Полезные команды](#14-полезные-команды)
15. [Решение проблем](#15-решение-проблем)

---

## 1. Подготовка сервера

### 1.1 Подключение к серверу по SSH

```bash
ssh root@ВАШ_IP_АДРЕС
```

### 1.2 Обновление системы

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Установка базовых пакетов

```bash
sudo apt install -y curl git build-essential ufw
```

### 1.4 Настройка файрвола (firewall)

```bash
# Разрешить SSH
sudo ufw allow OpenSSH

# Разрешить HTTP и HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Включить файрвол
sudo ufw enable

# Проверить статус
sudo ufw status
```

**Ожидаемый результат:**
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
80                         ALLOW       Anywhere
443                        ALLOW       Anywhere
```

---

## 2. Настройка DNS

### 2.1 Добавление A-записи

Зайдите в панель управления вашего регистратора домена и добавьте:

| Тип | Имя | Значение | TTL |
|-----|-----|----------|-----|
| A   | @   | ВАШ_IP_АДРЕС | 3600 |
| A   | www | ВАШ_IP_АДРЕС | 3600 |

**Пример для Cloudflare:**
- Тип: A
- Имя: @ (или sviydlyasvoih.com.ua)
- IPv4-адрес: 123.45.67.89 (ваш IP)
- Прокси: Выключен (оранжевое облачко серое)
- TTL: Auto

### 2.2 Проверка DNS

Подождите 5-30 минут, затем проверьте:

```bash
# На вашем компьютере
nslookup sviydlyasvoih.com.ua
# Или
ping sviydlyasvoih.com.ua
```

Должен вернуться ваш IP-адрес сервера.

---

## 3. Установка Node.js и PM2

### 3.1 Установка Node.js 20 LTS

```bash
# Добавить репозиторий NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Установить Node.js
sudo apt install -y nodejs

# Проверить версии
node -v    # Должно быть v20.x.x
npm -v     # Должно быть 10.x.x
```

### 3.2 Установка PM2 (менеджер процессов)

```bash
# Установить PM2 глобально
sudo npm install -g pm2

# Проверить
pm2 -v
```

### 3.3 Автозапуск PM2 при перезагрузке

```bash
pm2 startup systemd
```

**Важно!** Команда выведет что-то вроде:
```
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

**Скопируйте и выполните эту команду** (она будет уникальной для вашего сервера).

---

## 4. Установка PostgreSQL

### 4.1 Установка PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

### 4.2 Проверка статуса

```bash
sudo systemctl status postgresql
```

Должно быть `active (running)`.

### 4.3 Создание пользователя и базы данных

```bash
# Войти в консоль PostgreSQL
sudo -u postgres psql
```

**В консоли PostgreSQL выполните:**

```sql
-- Создать пользователя (замените PASSWORD на надёжный пароль)
CREATE USER sviy WITH PASSWORD 'ваш_надёжный_пароль_здесь';

-- Создать базу данных
CREATE DATABASE sviydlyasvoyikh OWNER sviy TEMPLATE template0 ENCODING 'UTF8';

-- Выдать права
GRANT ALL PRIVILEGES ON DATABASE sviydlyasvoyikh TO sviy;

-- Выйти
\q
```

### 4.4 Проверка подключения

```bash
PGPASSWORD='ваш_надёжный_пароль_здесь' psql -U sviy -d sviydlyasvoyikh -h localhost -c "SELECT 1;"
```

Должно вывести:
```
 ?column? 
----------
        1
```

---

## 5. Установка Nginx

### 5.1 Установка

```bash
sudo apt install -y nginx
```

### 5.2 Запуск и автозагрузка

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

### 5.3 Установка Certbot (для SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 6. Загрузка проекта

### 6.1 Создание директории

```bash
# Создать папку для сайта
sudo mkdir -p /var/www/sviydlyasvoih

# Передать права вашему пользователю
sudo chown -R $USER:$USER /var/www/sviydlyasvoih

# Перейти в папку
cd /var/www/sviydlyasvoih
```

### 6.2 Вариант А: Клонирование из Git

Если ваш проект на GitHub/GitLab:

```bash
git clone https://github.com/ВАШ_ЛОГИН/platform.git .
```

### 6.2 Вариант Б: Загрузка с локального компьютера

**На вашем Windows компьютере:**

```powershell
# Перейти в папку проекта
cd C:\Users\faila\Desktop\platform

# Создать архив (если есть 7-Zip)
7z a -tzip platform.zip * -xr!node_modules -xr!.next -xr!.git

# Или использовать Git Bash / WSL
tar -czf platform.tar.gz --exclude=node_modules --exclude=.next --exclude=.git *
```

**Загрузить на сервер (используя SCP или WinSCP):**

```powershell
# Через PowerShell (если есть SSH клиент)
scp platform.tar.gz root@ВАШ_IP:/var/www/sviydlyasvoih/
```

**На сервере распаковать:**

```bash
cd /var/www/sviydlyasvoih
tar -xzf platform.tar.gz
rm platform.tar.gz
```

### 6.3 Установка зависимостей

```bash
npm ci
```

**Примечание:** `npm ci` — это чистая установка из package-lock.json (быстрее и надёжнее чем `npm install`).

---

## 7. Настройка переменных окружения

### 7.1 Создание .env файла

```bash
nano .env
```

### 7.2 Содержимое .env

```env
# Окружение
NODE_ENV=production

# URL сайта
NEXT_PUBLIC_SITE_URL=https://sviydlyasvoih.com.ua

# JWT секрет (сгенерируйте случайную строку)
JWT_SECRET=сгенерируйте_длинную_случайную_строку_минимум_32_символа

# База данных (замените пароль)
DATABASE_URL="postgresql://sviy:ваш_надёжный_пароль_здесь@localhost:5432/sviydlyasvoyikh?schema=public"

# Порт (по умолчанию 3000)
PORT=3000
```

**Как сгенерировать JWT_SECRET:**

```bash
# На сервере выполните:
openssl rand -base64 32
```

Скопируйте результат и вставьте как значение JWT_SECRET.

### 7.3 Сохранение

- Нажмите `Ctrl+X`
- Нажмите `Y` (yes)
- Нажмите `Enter`

---

## 8. База данных и миграции

### 8.1 Генерация Prisma клиента

```bash
npx prisma generate
```

### 8.2 Применение миграций

```bash
npx prisma migrate deploy
```

Эта команда создаст все таблицы в базе данных.

### 8.3 (Опционально) Загрузка тестовых данных

Если хотите загрузить категории, города и демо-пользователей:

```bash
PGPASSWORD='ваш_надёжный_пароль_здесь' psql -U sviy -d sviydlyasvoyikh -h localhost -f database/seed.sql
```

**Примечание:** Категории будут созданы автоматически при первом обращении к `/api/categories`, даже если вы не запускали seed.sql.

---

## 9. Сборка и запуск приложения

### 9.1 Сборка production версии

```bash
npm run build
```

Это займёт 1-3 минуты. Ожидайте вывод:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
```

### 9.2 Запуск через PM2

```bash
pm2 start npm --name "sviy-web" -- start
```

### 9.3 Сохранение конфигурации PM2

```bash
pm2 save
```

Теперь PM2 автоматически запустит приложение при перезагрузке сервера.

### 9.4 Проверка статуса

```bash
pm2 status
pm2 logs sviy-web --lines 50
```

**Ожидаемый вывод:**
```
┌─────┬──────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name     │ mode        │ ↺       │ status  │ cpu      │
├─────┼──────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ sviy-web │ fork        │ 0       │ online  │ 0%       │
└─────┴──────────┴─────────────┴─────────┴─────────┴──────────┘
```

В логах должно быть:
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
- Network:      http://0.0.0.0:3000

✓ Ready in 1234ms
```

---

## 10. Настройка Nginx reverse proxy

### 10.1 Создание конфигурации

```bash
sudo nano /etc/nginx/sites-available/sviydlyasvoih.com.ua
```

### 10.2 Содержимое конфигурации

```nginx
server {
    listen 80;
    server_name sviydlyasvoih.com.ua www.sviydlyasvoih.com.ua;

    # Максимальный размер загружаемых файлов (для фото профилей)
    client_max_body_size 10M;

    # Проксирование на Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Кеширование статических файлов Next.js
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Статические файлы (загруженные изображения)
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=604800";
    }
}
```

### 10.3 Активация конфигурации

```bash
# Создать символическую ссылку
sudo ln -s /etc/nginx/sites-available/sviydlyasvoih.com.ua /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t
```

Должно вывести:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 10.4 Перезагрузка Nginx

```bash
sudo systemctl reload nginx
```

### 10.5 Проверка

Откройте браузер и зайдите на:
```
http://sviydlyasvoih.com.ua
```

Должна открыться главная страница платформы (пока без HTTPS).

---

## 11. SSL сертификат (HTTPS)

### 11.1 Получение бесплатного сертификата Let's Encrypt

```bash
sudo certbot --nginx -d sviydlyasvoih.com.ua -d www.sviydlyasvoih.com.ua
```

### 11.2 Ответы на вопросы Certbot

1. **Email:** Введите ваш email для уведомлений
2. **Terms of Service:** Нажмите `Y` (согласие с условиями)
3. **Share email:** Нажмите `N` (не отправлять email партнёрам)
4. **Redirect:** Выберите `2` (перенаправлять HTTP на HTTPS)

### 11.3 Проверка автообновления

```bash
sudo certbot renew --dry-run
```

Если вывод заканчивается на:
```
Congratulations, all simulated renewals succeeded
```

То всё настроено правильно. Certbot будет автоматически обновлять сертификат каждые 90 дней.

### 11.4 Проверка HTTPS

Откройте браузер:
```
https://sviydlyasvoih.com.ua
```

Должна открыться платформа с зелёным замочком в адресной строке.

---

## 12. Проверка работы

### 12.1 Проверка основных страниц

Откройте в браузере:

- ✅ Главная: https://sviydlyasvoih.com.ua
- ✅ Регистрация: https://sviydlyasvoih.com.ua/auth/register
- ✅ Каталог: https://sviydlyasvoih.com.ua/catalog
- ✅ Публичные услуги: https://sviydlyasvoih.com.ua/services

### 12.2 Тест регистрации

1. Перейдите на https://sviydlyasvoih.com.ua/auth/register
2. Выберите "Звичайний профіль"
3. Заполните форму регистрации
4. Проверьте, что регистрация прошла успешно

### 12.3 Тест создания услуги

1. Войдите в аккаунт
2. Перейдите в профиль
3. Нажмите "Додати послугу"
4. Заполните форму и загрузите фото
5. Проверьте, что услуга появилась в каталоге

### 12.4 Проверка загрузки изображений

```bash
# Проверить папку uploads
ls -la /var/www/sviydlyasvoih/public/uploads/avatars/

# Права должны быть 755
chmod -R 755 /var/www/sviydlyasvoih/public/uploads/
```

---

## 13. Обновление приложения

Когда вы внесли изменения в код и хотите обновить сайт:

### 13.1 Вариант А: Через Git

```bash
cd /var/www/sviydlyasvoih

# Получить последние изменения
git pull

# Установить новые зависимости (если были)
npm ci

# Применить миграции БД (если были)
npx prisma migrate deploy

# Пересобрать проект
npm run build

# Перезапустить приложение
pm2 restart sviy-web

# Проверить логи
pm2 logs sviy-web --lines 50
```

### 13.2 Вариант Б: Загрузка новой версии

```bash
# Остановить приложение
pm2 stop sviy-web

# Создать бэкап (на всякий случай)
cd /var/www
sudo tar -czf sviydlyasvoih-backup-$(date +%Y%m%d).tar.gz sviydlyasvoih/

# Загрузить новые файлы (через SCP/WinSCP)
# Затем:
cd /var/www/sviydlyasvoih
npm ci
npx prisma migrate deploy
npm run build
pm2 restart sviy-web
```

### 13.3 Только изменение .env

Если вы изменили только переменные окружения:

```bash
nano /var/www/sviydlyasvoih/.env
# Внести изменения, сохранить

# Перезапустить
pm2 restart sviy-web
```

---

## 14. Полезные команды

### PM2 (управление приложением)

```bash
# Статус
pm2 status

# Логи (последние 50 строк)
pm2 logs sviy-web --lines 50

# Логи в реальном времени
pm2 logs sviy-web

# Перезапуск
pm2 restart sviy-web

# Остановка
pm2 stop sviy-web

# Запуск
pm2 start sviy-web

# Удалить из PM2
pm2 delete sviy-web

# Очистить логи
pm2 flush sviy-web

# Информация о процессе
pm2 show sviy-web

# Мониторинг ресурсов
pm2 monit
```

### Nginx

```bash
# Проверить конфигурацию
sudo nginx -t

# Перезагрузить конфигурацию
sudo systemctl reload nginx

# Перезапустить Nginx
sudo systemctl restart nginx

# Статус
sudo systemctl status nginx

# Логи ошибок
sudo tail -f /var/log/nginx/error.log

# Логи доступа
sudo tail -f /var/log/nginx/access.log
```

### PostgreSQL

```bash
# Войти в консоль БД
sudo -u postgres psql

# Войти от имени sviy
PGPASSWORD='ваш_пароль' psql -U sviy -d sviydlyasvoyikh -h localhost

# Бэкап базы
pg_dump -U sviy -h localhost sviydlyasvoyikh > backup.sql

# Восстановление
psql -U sviy -h localhost sviydlyasvoyikh < backup.sql
```

### Мониторинг сервера

```bash
# Использование диска
df -h

# Использование памяти
free -h

# Процессы
htop
# (установить: sudo apt install htop)

# Размер папки проекта
du -sh /var/www/sviydlyasvoih
```

---

## 15. Решение проблем

### Проблема: Сайт не открывается

**Шаг 1:** Проверить, работает ли приложение
```bash
pm2 status
pm2 logs sviy-web --lines 100
```

**Шаг 2:** Проверить Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

**Шаг 3:** Проверить файрвол
```bash
sudo ufw status
```

**Шаг 4:** Проверить локально
```bash
curl http://localhost:3000
```

### Проблема: Ошибка базы данных

```bash
# Проверить, запущен ли PostgreSQL
sudo systemctl status postgresql

# Проверить подключение
PGPASSWORD='пароль' psql -U sviy -d sviydlyasvoyikh -h localhost -c "SELECT 1;"

# Проверить .env файл
cat /var/www/sviydlyasvoih/.env | grep DATABASE_URL
```

### Проблема: Изображения не загружаются

```bash
# Создать папку, если нет
mkdir -p /var/www/sviydlyasvoih/public/uploads/avatars

# Установить права
chmod -R 755 /var/www/sviydlyasvoih/public/uploads
chown -R $USER:$USER /var/www/sviydlyasvoih/public/uploads

# Проверить
ls -la /var/www/sviydlyasvoih/public/uploads/
```

### Проблема: 502 Bad Gateway

Это значит, что Nginx не может подключиться к Next.js.

```bash
# Проверить, запущено ли приложение
pm2 status

# Если остановлено — запустить
pm2 start sviy-web

# Проверить логи
pm2 logs sviy-web --lines 100
```

### Проблема: Высокое использование памяти

```bash
# Проверить память
free -h

# Перезапустить приложение
pm2 restart sviy-web

# Посмотреть использование PM2
pm2 monit
```

### Проблема: SSL сертификат не обновляется

```bash
# Проверить Certbot
sudo certbot renew --dry-run

# Посмотреть срок действия
sudo certbot certificates

# Принудительное обновление
sudo certbot renew --force-renewal
```

---

## 🎉 Готово!

Ваша платформа **Свій для Своїх** успешно развёрнута на:

**https://sviydlyasvoih.com.ua**

### Что дальше?

1. **Настройте email:** Подключите SMTP для отправки уведомлений (опционально)
2. **Мониторинг:** Настройте Uptime мониторинг (UptimeRobot, Pingdom)
3. **Бэкапы:** Настройте автоматические бэкапы БД
4. **CDN:** Подключите Cloudflare для ускорения (опционально)

### Поддержка

Если возникли вопросы:
- Проверьте логи: `pm2 logs sviy-web`
- Проверьте Nginx: `sudo tail -f /var/log/nginx/error.log`
- Проверьте БД: подключение и миграции

---

**Автор:** AI Assistant  
**Дата:** 29 октября 2025  
**Версия:** 1.0
