# 📝 ЩО ЗАЛИШИЛОСЬ ЗРОБИТИ ВРУЧНУ

## ✅ Вже зроблено автоматично:
1. ✅ Оновлено `prisma/schema.prisma` - нові типи акаунтів та моделі
2. ✅ Оновлено `src/lib/ucm.ts` - ціни та функції платних дій
3. ✅ Створено API для платних дій:
   - `/api/paid-actions/charge` - списання коштів
   - `/api/paid-actions/info` - інформація про ціни
4. ✅ Створено API для рефералів:
   - `/api/referrals/stats` - статистика
5. ✅ Створено компонент `PaidFeatureButton`
6. ✅ Створено сторінку `/referrals`
7. ✅ Створено міграцію БД

---

## ⚠️ Потрібно доробити вручну:

### 1. Оновити сторінку вибору типу реєстрації
**Файл:** `src/app/auth/register/page.tsx`

Замінити список типів акаунтів на:
```typescript
const accountTypes = [
  {
    id: 'viewer',
    name: 'Глядач',
    icon: Eye,
    color: 'bg-neutral-500',
    price: 'Безкоштовно',
    description: 'Базова реєстрація для перегляду',
    features: [
      'Перегляд профілів',
      'Перегляд послуг',
      'Базова інформація',
    ],
    limitations: [
      'Не можна залишати заявки',
      'Немає платних функцій',
    ]
  },
  {
    id: 'basic',
    name: 'Звичайний',
    icon: User,
    color: 'bg-primary-500',
    price: 'Безкоштовно',
    description: 'Повна анкета + платні функції',
    features: [
      'Детальна анкета (безкоштовно)',
      'Пошук пари (5 уцмок)',
      'Заявки на роботу (3 уцмки)',
      'Розширений пошук (2 уцмки)',
      'Заробіть через рефералів',
    ],
    limitations: []
  },
  {
    id: 'business',
    name: 'Бізнес',
    icon: Building,
    color: 'bg-accent-500',
    price: 'Безкоштовно',
    description: 'Бізнес-профіль + платні функції',
    features: [
      'Повний бізнес-профіль (безкоштовно)',
      'Пошук партнерів (5 уцмок)',
      'Пошук інвесторів (5 уцмок)',
      'Пошук працівників (4 уцмки)',
      'Галерея та сертифікати',
    ],
    limitations: []
  }
]
```

### 2. Оновити маршрути реєстрації
**У файлі:** `src/app/auth/register/page.tsx`

В `handleSelect`:
```typescript
const handleSelect = (typeId: string) => {
  if (typeId === 'viewer') {
    router.push('/auth/register/viewer')
  } else if (typeId === 'basic') {
    router.push('/auth/register/basic')  // або /individual
  } else if (typeId === 'business') {
    router.push('/auth/register/business')
  }
}
```

### 3. Оновити API реєстрації
**Файл:** `src/app/api/auth/register/route.ts`

Змінити валідацію:
```typescript
// Старе
const validAccountTypes = ['guest', 'basic', 'extended'];

// Нове
const validAccountTypes = ['viewer', 'basic', 'business'];
```

Також в `src/app/api/auth/register-business/route.ts`:
```typescript
accountType = 'business'; // замість 'business_premium'
```

### 4. Оновити сторінки форм реєстрації

**`src/app/auth/register/viewer/page.tsx`:**
- Залишити тільки базові поля (ПІБ, email, телефон, місто)
- `accountType: 'viewer'`

**`src/app/auth/register/basic/page.tsx` (або `/individual`):**
- Повна детальна анкета
- `accountType: 'basic'`
- Додати інформацію про платні функції

**`src/app/auth/register/business/page.tsx`:**
- Повний бізнес-профіль
- `accountType: 'business'`
- Додати інформацію про платні функції

### 5. Додати компонент відображення балансу
**Файл:** `src/components/layout/Navbar.tsx`

В меню профілю додати:
```tsx
{balance !== null && (
  <div className="px-4 py-2 border-b border-neutral-200">
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-600">Баланс:</span>
      <span className="font-bold text-primary-600">{balance} уцмок</span>
    </div>
    <Link
      href="/referrals"
      className="text-xs text-primary-500 hover:underline"
    >
      Заробити більше →
    </Link>
  </div>
)}
```

### 6. Оновити компонент AccountTypeBadge
**Файл:** `src/components/ui/AccountTypeBadge.tsx`

Видалити старі типи, залишити:
```typescript
type AccountType = 'viewer' | 'basic' | 'business';

const badges = {
  viewer: { label: 'Глядач', color: 'bg-neutral-100 text-neutral-700' },
  basic: { label: 'Звичайний', color: 'bg-primary-100 text-primary-700' },
  business: { label: 'Бізнес', color: 'bg-accent-100 text-accent-700' },
}
```

### 7. Інтегрувати PaidFeatureButton

**Приклад використання в формі заявки:**
```tsx
import { PaidFeatureButton } from '@/components/features/paid/PaidFeatureButton'

// В компоненті
const [userBalance, setUserBalance] = useState(0)

// Завантажити баланс
useEffect(() => {
  fetch('/api/profile/balance')
    .then(res => res.json())
    .then(data => setUserBalance(data.balance))
}, [])

// В формі
<PaidFeatureButton
  actionType="partner_search"
  cost={5}
  userBalance={userBalance}
  onSuccess={(result) => {
    // Створити заявку після успішної оплати
    submitRequest()
  }}
  onError={(error) => {
    alert(error)
  }}
  className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold"
>
  Створити заявку (5 уцмок)
</PaidFeatureButton>
```

### 8. Додати посилання на рефералів

**В навігації (`Navbar`) або футері:**
```tsx
<Link href="/referrals" className="...">
  🎁 Заробляй уцмки
</Link>
```

**На головній сторінці:**
```tsx
<section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-12">
  <div className="container mx-auto text-center">
    <h2 className="text-3xl font-bold mb-4">Запрошуй друзів — заробляй уцмки!</h2>
    <p className="text-xl mb-6">Ти та твій друг отримаєте по 1 уцмці</p>
    <Link href="/referrals" className="bg-white text-primary-600 px-8 py-3 rounded-lg">
      Отримати посилання →
    </Link>
  </div>
</section>
```

### 9. Оновити заявки на використання платних дій

**Файл:** `src/app/api/requests/create/route.ts`

Замінити:
```typescript
// Старе
const cost = String(type) === 'partner' ? UCM_COSTS.partnerRequest : 0;

// Нове
import { chargePaidAction } from '@/lib/ucm'

let cost = 0;
let actionType = null;

if (type === 'partner') {
  cost = 5;
  actionType = 'partner_search';
} else if (type === 'job') {
  cost = 3;
  actionType = 'job_request';
} else if (type === 'service') {
  cost = 3;
  actionType = 'service_request';
}
// і т.д.

if (cost > 0) {
  await chargePaidAction({
    userId,
    actionType,
    relatedEntityType: 'request',
    relatedEntityId: created.id
  });
}
```

---

## 🎯 Порядок виконання:

1. ✅ Спочатку на VPS:
   - Backup БД
   - Запустити міграцію
   - Перезапустити додаток

2. ✅ Потім у коді:
   - Оновити типи акаунтів в формах
   - Оновити API реєстрації
   - Додати PaidFeatureButton у потрібні місця
   - Оновити навігацію

3. ✅ Тестування:
   - Перевірити реєстрацію всіх типів
   - Перевірити платні дії
   - Перевірити рефералів

---

## 📦 Готові файли для копіювання:

Всі нові файли вже створені:
- ✅ `src/app/api/paid-actions/charge/route.ts`
- ✅ `src/app/api/paid-actions/info/route.ts`
- ✅ `src/app/api/referrals/stats/route.ts`
- ✅ `src/app/referrals/page.tsx`
- ✅ `src/components/features/paid/PaidFeatureButton.tsx`
- ✅ `database/migrations/20251118_new_registration_system.sql`

Потрібно тільки **оновити існуючі** файли згідно з інструкціями вище!
