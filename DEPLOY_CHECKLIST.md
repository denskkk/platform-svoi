# 🚀 Чеклист деплою виправлень реєстрації

## 📋 Що потрібно зробити:

### 1. ✅ Локально (Windows)

```powershell
# Перевірити що всі файли збережені
git status

# Додати всі зміни
git add .

# Закомітити
git commit -m "fix: registration system - return token, make city optional, add client-auth helpers"

# Відправити на GitHub
git push origin main
```

---

### 2. 🔧 На VPS (Ubuntu)

```bash
# З'єднатись з VPS
ssh root@vps-52355

# Перейти в директорію проекту
cd /var/www/sviydlyasvoih/platform-svoi

# Оновити код
git pull origin main

# Перебудувати проект
npm run build

# Перезапустити PM2
pm2 restart sviy-web

# Перевірити логи (Ctrl+C для виходу)
pm2 logs sviy-web --lines 50
```

---

### 3. ✅ Тестування реєстрації

#### Тест 1: Реєстрація глядача
1. Відкрити: http://sviydlyasvoih.com.ua/auth/register/viewer
2. Заповнити:
   - Ім'я: `Тест`
   - Прізвище: `Користувач`
   - Email: `test@example.com`
   - Пароль: `Test1234`
   - Підтвердження: `Test1234`
   - **Залишити порожніми:** Телефон, Місто
3. Натиснути "Зареєструватися"
4. ✅ **Очікуємо:** Редірект на `/catalog`, дані в localStorage

#### Тест 2: Реєстрація бізнесу
1. Відкрити: http://sviydlyasvoih.com.ua/auth/register/business
2. Заповнити:
   - Ім'я: `Олександр Підприємець`
   - Email: `business@example.com`
   - Телефон: `+380501234567`
   - Пароль: `Business1234`
   - Підтвердження: `Business1234`
   - **Залишити порожнім:** Місто
3. Натиснути "Продовжити"
4. ✅ **Очікуємо:** Редірект на `/auth/business-questionnaire`, дані в localStorage

#### Перевірка localStorage:
Після кожної реєстрації відкрити DevTools (F12):
- Application → Local Storage → домен
- Має бути:
  - ✅ `user` - JSON з даними користувача
  - ✅ `token` - JWT токен (довгий рядок)

---

### 4. 🔐 SSL сертифікат (після тестування)

```bash
# Встановити Certbot (якщо ще не встановлений)
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Отримати SSL сертифікат
sudo certbot --nginx -d sviydlyasvoih.com.ua -d www.sviydlyasvoih.com.ua

# Перевірити автопродовження
sudo certbot renew --dry-run
```

✅ Після цього сайт буде доступний на HTTPS

---

### 5. 🔄 Налаштувати автозапуск PM2

```bash
# Зберегти поточну конфігурацію PM2
pm2 save

# Налаштувати автозапуск при перезавантаженні сервера
pm2 startup

# Виконати команду яку покаже pm2 startup
# Вона буде виглядати приблизно так:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

✅ Тепер PM2 запуститься автоматично при перезавантаженні

---

## 🎯 Очікувані результати:

### ✅ Після деплою:
- Код оновлено на VPS
- Білд пройшов успішно
- PM2 процес працює без помилок
- Логи показують "✓ Ready in XXXms"

### ✅ Після тестування:
- Реєстрація глядача працює без міста/телефону
- Реєстрація бізнесу працює без міста
- localStorage містить `user` та `token`
- Редіректи працюють правильно

### ✅ Після SSL:
- Сайт доступний на https://sviydlyasvoih.com.ua
- HTTP редіректить на HTTPS
- Зелений замочок в браузері

---

## 🆘 Якщо щось не працює:

### Помилка білду:
```bash
# Видалити .next та node_modules
rm -rf .next node_modules

# Переустановити залежності
npm install

# Повторити білд
npm run build
```

### PM2 не запускається:
```bash
# Перевірити статус
pm2 status

# Перезапустити
pm2 delete sviy-web
pm2 start npm --name sviy-web -- start

# Дивитись логи в реальному часі
pm2 logs sviy-web
```

### База даних не підключається:
```bash
# Перевірити PostgreSQL
sudo systemctl status postgresql

# Перевірити підключення
psql -U sviy -d sviydlyasvoyikh -c "SELECT 1;"

# Перевірити .env файл
cat .env | grep DATABASE_URL
```

---

## 📝 Змінені файли (для довідки):

1. `src/app/api/auth/register/route.ts` - повертає token
2. `src/lib/client-auth.ts` - **новий** helper
3. `src/app/auth/register/viewer/page.tsx` - city необов'язкове
4. `src/app/auth/register/business/page.tsx` - city необов'язкове
5. `REGISTRATION_FIX.md` - **нова** документація
6. `DEPLOY_CHECKLIST.md` - **цей** чеклист

---

**Готові деплоїти?** Почніть з кроку 1 ☝️
