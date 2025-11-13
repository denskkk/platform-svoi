# Исправление проблемы отображения загруженных изображений

## Проблема
При регистрации нового пользователя и загрузке фото профиля или изображений услуг, они не отображались сразу после загрузки из-за кеширования браузера.

## Решение

### 1. Добавлен cache-busting для API запросов профиля
**Файл:** `src/app/profile/[id]/page.tsx`

Изменено:
- При загрузке профиля добавляется timestamp параметр к URL API
- Добавлены заголовки для предотвращения кеширования (`Cache-Control`, `Pragma`)

```typescript
const cacheBuster = `t=${Date.now()}`;
const response = await fetch(`/api/profile/${params.id}?${cacheBuster}`, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  }
});
```

### 2. Обновлены функции загрузки изображений

#### Аватар профиля
**Файл:** `src/app/profile/edit/page.tsx`

```typescript
const uploadAvatar = async (): Promise<string | null> => {
  // ...
  if (response.ok && data.url) {
    const urlWithTimestamp = `${data.url}?t=${Date.now()}`;
    return urlWithTimestamp;
  }
}
```

#### Изображения услуг
**Файл:** `src/app/services/create/page.tsx`

```typescript
const uploadImage = async (): Promise<string | null> => {
  // ...
  if (response.ok && data.url) {
    const urlWithTimestamp = `${data.url}?t=${Date.now()}`;
    return urlWithTimestamp;
  }
}
```

#### Логотип и баннер бизнес-профиля
**Файл:** `src/app/profile/edit-business/page.tsx`

```typescript
const uploadLogo = async (): Promise<string | null> => {
  // ...
  const urlWithTimestamp = `${data.url}?t=${Date.now()}`;
  return urlWithTimestamp;
}

const uploadBanner = async (): Promise<string | null> => {
  // ...
  const urlWithTimestamp = `${data.url}?t=${Date.now()}`;
  return urlWithTimestamp;
}
```

### 3. Обновлены компоненты отображения изображений

#### UserAvatar
**Файл:** `src/components/ui/UserAvatar.tsx`

Изменено:
- Проверка наличия timestamp в URL перед добавлением cache-busting
- Если URL уже содержит `?t=` или `&t=`, используется как есть
- Для старых URL автоматически добавляется timestamp

```typescript
useEffect(() => {
  setImageError(false);
  setRetried(false);
  if (src && !src.startsWith('data:')) {
    if (src.includes('?t=') || src.includes('&t=')) {
      setImageSrc(src);
    } else {
      setImageSrc(withCacheBuster(src));
    }
  } else {
    setImageSrc(src || null);
  }
}, [src]);
```

#### ServiceImage
**Файл:** `src/components/ui/ServiceImage.tsx`

Изменено:
- Аналогичная логика проверки timestamp
- Автоматическое добавление timestamp только для URL без него

### 4. Очистка URL перед сохранением в базу данных

Перед отправкой данных в API, timestamp удаляется из URL:

```typescript
// В src/app/services/create/page.tsx
imageUrl: imageUrl ? imageUrl.split('?')[0] : null

// В src/app/profile/edit-business/page.tsx
const cleanUrl = (url: string | null) => url ? url.split('?')[0] : null;
logoUrl: cleanUrl(logoUrl),
bannerUrl: cleanUrl(bannerUrl),
```

### 5. Обновление localStorage после сохранения

**Файл:** `src/app/profile/edit/page.tsx`

После успешного сохранения профиля:
- Обновляется localStorage с новыми данными
- Обновляется локальный state
- Отправляется событие `userUpdated` для синхронизации других компонентов

```typescript
const updatedUser = {
  ...user,
  ...data.user,
  avatarUrl: avatarUrl || user.avatarUrl,
};
localStorage.setItem('user', JSON.stringify(updatedUser));
setUser(updatedUser);
window.dispatchEvent(new Event('userUpdated'));
```

## Результат

Теперь при загрузке новых изображений:
1. ✅ Изображения сразу отображаются после загрузки
2. ✅ Браузер не использует устаревший кеш
3. ✅ URL в базе данных остаются чистыми (без timestamp)
4. ✅ Компоненты автоматически обновляются при изменении данных
5. ✅ Старые изображения продолжают работать с автоматическим cache-busting

## Тестирование

Для проверки:
1. Зарегистрируйте нового пользователя
2. Загрузите фото профиля - оно должно сразу отобразиться
3. Создайте услугу с изображением - изображение должно сразу отобразиться
4. Для бизнес-аккаунта загрузите логотип и баннер - они должны сразу отобразиться
