# Виправлення системи реєстрації

## Зміни від 30 жовтня 2024

### Проблеми що були виправлені:

1. ❌ **API не повертав токен в JSON** - фронтенд очікував `data.token`, але API коментував цю строку
2. ❌ **Місто було обов'язковим** - поле `city` було required в бізнес-реєстрації
3. ❌ **Неконсистентне зберігання даних** - різні способи роботи з localStorage
4. ❌ **Порожні рядки відправлялись на сервер** - `city: ''` замість `city: undefined`

---

## ✅ Що виправлено:

### 1. API Реєстрації (`/api/auth/register`)

**Файл:** `src/app/api/auth/register/route.ts`

**Зміна:**
```typescript
// БУЛО:
const response = NextResponse.json({
  success: true,
  message: 'Реєстрація успішна!',
  user,
  // НЕ повертаємо token в JSON
}, { status: 201 });

// СТАЛО:
const response = NextResponse.json({
  success: true,
  message: 'Реєстрація успішна!',
  user,
  token, // ✅ Повертаємо токен для localStorage
}, { status: 201 });
```

✅ Тепер API повертає і токен в JSON (для localStorage), і встановлює httpOnly cookie (для безпеки)

---

### 2. Створено helper для клієнтської автентифікації

**Файл:** `src/lib/client-auth.ts` *(новий)*

Функції:
- `saveUser(user)` - зберегти користувача в localStorage
- `saveToken(token)` - зберегти токен в localStorage  
- `getUser()` - отримати користувача
- `getToken()` - отримати токен
- `clearAuth()` - очистити всі дані
- `isAuthenticated()` - перевірити чи залогінений
- `logout()` - вийти (викликає API + очищає localStorage)

✅ Централізована логіка роботи з автентифікацією на клієнті

---

### 3. Реєстрація глядача (user)

**Файл:** `src/app/auth/register/viewer/page.tsx`

**Зміни:**

1. **Імпорт helper функцій:**
```typescript
import { saveUser, saveToken } from '@/lib/client-auth';
```

2. **Відправка даних без порожніх значень:**
```typescript
body: JSON.stringify({
  firstName: formData.firstName,
  lastName: formData.lastName,
  email: formData.email,
  password: formData.password,
  phone: formData.phone || undefined, // ✅ не відправляти порожній рядок
  city: formData.city || undefined,   // ✅ не відправляти порожній рядок
  role: 'user',
})
```

3. **Збереження даних після успішної реєстрації:**
```typescript
// БУЛО:
if (data.user) {
  localStorage.setItem('user', JSON.stringify(data.user));
}

// СТАЛО:
if (data.user) {
  saveUser(data.user);
}
if (data.token) {
  saveToken(data.token);
}
```

✅ Використання helper функцій, токен зберігається

---

### 4. Реєстрація бізнесу

**Файл:** `src/app/auth/register/business/page.tsx`

**Зміни:**

1. **Імпорт helper функцій:**
```typescript
import { saveUser, saveToken } from '@/lib/client-auth'
```

2. **Місто тепер необов'язкове:**
```tsx
<label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
  Місто (необов&apos;язково) {/* ✅ Додано текст */}
</label>
<select
  id="city"
  value={formData.city}
  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
  className="..." 
  // ❌ ВИДАЛЕНО: required
>
  <option value="">Оберіть місто (необов&apos;язково)</option>
  {/* ... */}
</select>
<p className="mt-1 text-xs text-neutral-500">
  Можете вказати пізніше в анкеті {/* ✅ Підказка */}
</p>
```

3. **Відправка без порожніх значень:**
```typescript
body: JSON.stringify({
  firstName,
  lastName,
  email: formData.email,
  phone: formData.phone,
  password: formData.password,
  city: formData.city || undefined, // ✅ не відправляти порожній рядок
  role: 'business',
})
```

4. **Збереження через helper:**
```typescript
if (data.token) {
  saveToken(data.token)
}
if (data.user) {
  saveUser(data.user)
}
```

✅ Місто необов'язкове, використовуються helper функції

---

## Як працює тепер:

### Реєстрація User (глядача):
1. Користувач заповнює форму `/auth/register/viewer`
2. Поля `phone` та `city` - **необов'язкові**
3. POST `/api/auth/register` з `role: 'user'`
4. API створює користувача, повертає `{ user, token }`
5. Токен та користувач зберігаються в localStorage
6. Redirect на `/catalog`

### Реєстрація Business (підприємця):
1. Користувач заповнює форму `/auth/register/business`
2. Поле `city` - **необов'язкове** (можна вказати в анкеті)
3. POST `/api/auth/register` з `role: 'business'`
4. API створює користувача, повертає `{ user, token }`
5. Токен та користувач зберігаються в localStorage
6. Redirect на `/auth/business-questionnaire`

---

## Тестування на production:

### 1. Тест реєстрації глядача:
```
https://sviydlyasvoih.com.ua/auth/register/viewer
```
- Заповніть тільки: ім'я, прізвище, email, пароль
- Залиште порожніми: телефон, місто
- ✅ Має пройти успішно

### 2. Тест реєстрації бізнесу:
```
https://sviydlyasvoih.com.ua/auth/register/business
```
- Заповніть: ім'я, email, телефон, пароль
- Залиште порожнім: місто
- ✅ Має пройти успішно і перенаправити на бізнес-анкету

### 3. Перевірка localStorage:
Після реєстрації відкрийте DevTools → Application → Local Storage:
- ✅ `user` - об'єкт з даними користувача
- ✅ `token` - JWT токен

---

## Деплой на VPS:

```bash
# На локальній машині
git add .
git commit -m "fix: registration system - return token, make city optional, add client-auth helpers"
git push origin main

# На VPS
cd /var/www/sviydlyasvoih/platform-svoi
git pull origin main
npm run build
pm2 restart sviy-web
pm2 logs sviy-web
```

---

## Файли що змінилися:

- ✅ `src/app/api/auth/register/route.ts` - повертає token в JSON
- ✅ `src/lib/client-auth.ts` - **новий файл** з helper функціями
- ✅ `src/app/auth/register/viewer/page.tsx` - використовує helpers, city необов'язкове
- ✅ `src/app/auth/register/business/page.tsx` - використовує helpers, city необов'язкове

---

## Наступні кроки:

1. ⬜ Закомітити зміни
2. ⬜ Задеплоїти на VPS
3. ⬜ Протестувати обидві форми реєстрації
4. ⬜ Встановити SSL сертифікат (Certbot)
5. ⬜ Виправити questionnaire save flow (todo #3)

---

**Дата виправлення:** 30 жовтня 2024  
**Статус:** ✅ Готово до деплою
