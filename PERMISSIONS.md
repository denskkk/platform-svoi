# Система дозволів (Permission System)

## Огляд

Система дозволів контролює доступ до функцій залежно від типу облікового запису користувача.

## Типи облікових записів

1. **Guest** (Гість) - без реєстрації
2. **Basic** (Базовий) - безкоштовний
3. **Extended** (Розширений) - 199 грн/міс
4. **Business** (Бізнес) - 499 грн/міс
5. **Business Premium** (Бізнес Преміум) - 999 грн/міс

## Матриця дозволів

### Базові функції
- `VIEW_CATALOG` - перегляд каталогу (всі)
- `VIEW_PROFILE` - перегляд профілів (basic+)
- `EDIT_PROFILE` - редагування профілю (basic+)

### Обране
- `ADD_TO_FAVORITES` - додавання в обране (basic+)
- `VIEW_FAVORITES` - перегляд обраного (basic+)

### Послуги
- `CREATE_SERVICE` - створення послуг (business+)
- `EDIT_SERVICE` - редагування послуг (business+)
- `DELETE_SERVICE` - видалення послуг (business+)

### Заявки
- `CREATE_REQUEST` - створення заявок (extended+)
- `VIEW_REQUESTS` - перегляд заявок (extended+)
- `RESPOND_TO_REQUEST` - відповідь на заявки (business+)

### Повідомлення
- `SEND_MESSAGE` - відправка повідомлень (extended+)
- `VIEW_MESSAGES` - перегляд повідомлень (extended+)

### Відгуки
- `LEAVE_REVIEW` - залишення відгуків (basic+)

### Бізнес-функції
- `SEARCH_PARTNERS` - пошук партнерів (business+)
- `SEARCH_INVESTORS` - пошук інвесторів (business+)
- `SEARCH_CUSTOMERS` - пошук клієнтів (business+)

### Преміум-функції
- `AUTO_PROPOSALS` - автоматичні пропозиції (premium)
- `UCM_ANALYSIS` - UCM аналіз (premium)
- `PRIORITY_SEARCH` - пріоритетний пошук (premium)
- `ADVANCED_ANALYTICS` - розширена аналітика (premium)

## Використання

### 1. Перевірка дозволів на сервері (API)

```typescript
import { requireAuthWithPermission } from '@/lib/api-middleware';

export async function POST(request: NextRequest) {
  // Перевірка авторизації та дозволів
  const authResult = await requireAuthWithPermission(request, 'CREATE_SERVICE');
  
  if (authResult.error) {
    return authResult.error; // Повертає 401 або 403
  }

  // Користувач має доступ
  const user = authResult.user;
  
  // Ваша логіка...
}
```

### 2. Перевірка дозволів на клієнті (React)

#### Використання хука

```tsx
import { usePermission } from '@/hooks/usePermission';

function MyComponent() {
  const { hasAccess, errorMessage, loading } = usePermission('CREATE_SERVICE');

  if (loading) return <div>Завантаження...</div>;
  
  if (!hasAccess) {
    return <div>{errorMessage}</div>;
  }

  return <div>Контент доступний</div>;
}
```

#### Компонент RequirePermission

```tsx
import { RequirePermission } from '@/components/ui/RequirePermission';

function MyPage() {
  return (
    <RequirePermission permission="CREATE_SERVICE">
      <ServiceForm />
    </RequirePermission>
  );
}
```

#### Кнопка з перевіркою дозволів

```tsx
import { PermissionButton } from '@/components/ui/RequirePermission';

function MyComponent() {
  return (
    <PermissionButton 
      permission="SEND_MESSAGE"
      onClick={handleSendMessage}
    >
      Відправити повідомлення
    </PermissionButton>
  );
}
```

### 3. Бейджі для преміум функцій

```tsx
import { PremiumBadge, BusinessBadge } from '@/components/ui/RequirePermission';

function FeatureList() {
  return (
    <div>
      <h3>UCM Аналіз <PremiumBadge /></h3>
      <h3>Пошук партнерів <BusinessBadge /></h3>
    </div>
  );
}
```

### 4. Хелпери

```tsx
import { useIsBusiness, useIsPremium } from '@/hooks/usePermission';

function MyComponent() {
  const isBusiness = useIsBusiness(); // true для business і business_premium
  const isPremium = useIsPremium();   // true тільки для business_premium

  return (
    <div>
      {isBusiness && <BusinessFeatures />}
      {isPremium && <PremiumFeatures />}
    </div>
  );
}
```

## Додавання нових дозволів

1. Додайте новий дозвіл в `src/lib/permissions.ts`:

```typescript
export const PERMISSIONS = {
  // ... існуючі дозволи
  MY_NEW_PERMISSION: ['business', 'business_premium'] as AccountType[],
} as const;
```

2. Додайте повідомлення про помилку:

```typescript
export function getPermissionError(permission: Permission): string {
  const errors: Record<Permission, string> = {
    // ... існуючі помилки
    MY_NEW_PERMISSION: 'Ця функція доступна тільки для бізнес-акаунтів',
  };
  return errors[permission] || 'Недостатньо прав доступу';
}
```

3. Використовуйте в коді:

```typescript
// API
const authResult = await requireAuthWithPermission(request, 'MY_NEW_PERMISSION');

// UI
<RequirePermission permission="MY_NEW_PERMISSION">
  <MyFeature />
</RequirePermission>
```

## Ціноутворення

Сторінка з планами: `/pricing`

Користувачі які не мають доступу до функції автоматично бачать кнопку "Оновити план" яка веде на сторінку pricing.

## Помилки API

### 401 Unauthorized
Користувач не авторизований або токен невалідний.

```json
{
  "error": "Необхідна авторизація"
}
```

### 403 Forbidden
Користувач авторизований але не має прав доступу.

```json
{
  "error": "Ця функція доступна тільки для бізнес-акаунтів",
  "requiredPermission": "CREATE_SERVICE",
  "currentAccountType": "basic"
}
```

## Приклади інтеграції

### Захист API endpoint'у для створення послуг

```typescript
// src/app/api/services/route.ts
import { requireAuthWithPermission } from '@/lib/api-middleware';

export async function POST(request: NextRequest) {
  const authResult = await requireAuthWithPermission(request, 'CREATE_SERVICE');
  if (authResult.error) return authResult.error;

  // Створення послуги...
}
```

### Сторінка створення послуги

```tsx
// src/app/services/create/page.tsx
import { RequirePermission } from '@/components/ui/RequirePermission';

export default function CreateServicePage() {
  return (
    <RequirePermission permission="CREATE_SERVICE">
      <ServiceForm />
    </RequirePermission>
  );
}
```

### Кнопка відправки повідомлення

```tsx
import { PermissionButton } from '@/components/ui/RequirePermission';

<PermissionButton
  permission="SEND_MESSAGE"
  onClick={handleSendMessage}
  className="btn-primary"
>
  Написати повідомлення
</PermissionButton>
```

## Тестування

Для тестування різних типів акаунтів:

1. Зареєструйте користувача з потрібним `accountType`
2. Змініть `accountType` в localStorage:
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   user.accountType = 'business_premium';
   localStorage.setItem('user', JSON.stringify(user));
   ```
3. Перезавантажте сторінку

## Статус інтеграції

Захист прав застосовано до таких функцій:

- [x] Створення послуг (API + UI) — `CREATE_SERVICE`
- [x] Редагування/видалення послуг (API) — `EDIT_SERVICE`, `DELETE_SERVICE`
- [x] Повідомлення (API GET/POST) — `VIEW_MESSAGES`, `SEND_MESSAGE`
- [x] Обране (API GET/POST/DELETE) — `VIEW_FAVORITES`, `ADD_TO_FAVORITES`
- [x] Відгуки (API POST) — `LEAVE_REVIEW`
- [ ] Заявки (створення/перегляд/відповідь) — `CREATE_REQUEST`, `VIEW_REQUESTS`, `RESPOND_TO_REQUEST`
- [ ] Бізнес-пошук — `SEARCH_PARTNERS`, `SEARCH_INVESTORS`, `SEARCH_CUSTOMERS`
- [x] Бізнес-профіль (створення/оновлення) — `EDIT_BUSINESS_PROFILE`
- [ ] Преміум-функції — `AUTO_PROPOSALS`, `UCM_ANALYSIS`, `PRIORITY_SEARCH`, `ADVANCED_ANALYTICS`

## FAQ

**Q: Чи можу я мати кілька активних дозволів одночасно?**
A: Так, один компонент може перевіряти кілька дозволів.

**Q: Як показати різний контент для різних типів акаунтів?**
A: Використовуйте умовний рендерінг з `usePermission` або `useIsBusiness`/`useIsPremium`.

**Q: Чи безпечно перевіряти дозволи тільки на клієнті?**
A: Ні! ЗАВЖДИ перевіряйте дозволи на сервері (API). Клієнтська перевірка тільки для UX.

**Q: Як обробити помилку 403 на клієнті?**
A: API повертає детальну інформацію про помилку включно з `requiredPermission`. Покажіть користувачу повідомлення і кнопку оновлення плану.
