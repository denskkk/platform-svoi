# Инструкция по развертыванию исправлений отображения изображений

## Изменения

Исправлена проблема, когда изображения профиля и услуг не отображались сразу после загрузки для новых пользователей.

## Измененные файлы

1. `src/app/profile/[id]/page.tsx` - добавлен cache-busting для API профиля
2. `src/app/profile/edit/page.tsx` - улучшена загрузка аватара
3. `src/app/services/create/page.tsx` - улучшена загрузка изображений услуг
4. `src/app/profile/edit-business/page.tsx` - улучшена загрузка логотипа и баннера
5. `src/components/ui/UserAvatar.tsx` - улучшено отображение аватаров
6. `src/components/ui/ServiceImage.tsx` - улучшено отображение изображений услуг

## Команды для развертывания на сервере

### 1. Подключитесь к серверу
```bash
ssh root@sviydlyasvoih.com.ua
```

### 2. Перейдите в директорию проекта
```bash
cd /var/www/sviydlyasvoih/platform-svoi
```

### 3. Сделайте резервную копию текущей версии (опционально)
```bash
cp -r .next .next.backup.$(date +%Y%m%d_%H%M%S)
```

### 4. Получите последние изменения из Git
```bash
git fetch origin
git pull origin main
```

### 5. Установите зависимости (если добавились новые)
```bash
npm install
```

### 6. Соберите проект
```bash
npm run build
```

### 7. Перезапустите PM2
```bash
pm2 restart sviy-web
```

### 8. Проверьте логи
```bash
pm2 logs sviy-web --lines 50
```

## Проверка работы

После развертывания:

1. Зарегистрируйте нового тестового пользователя
2. Загрузите фото профиля → должно сразу отобразиться
3. Создайте услугу с изображением → должно сразу отобразиться
4. Проверьте бизнес-профиль (логотип и баннер)

## Откат изменений (если что-то пошло не так)

```bash
cd /var/www/sviydlyasvoih/platform-svoi
git reset --hard HEAD~1
npm run build
pm2 restart sviy-web
```

## Проверка прав доступа к папкам uploads

Убедитесь, что папки uploads имеют правильные права:

```bash
# Проверка текущих прав
ls -la /var/www/sviydlyasvoih/platform-svoi/public/uploads/

# Установка правильных прав (если нужно)
chown -R www-data:www-data /var/www/sviydlyasvoih/platform-svoi/public/uploads/
chmod -R 755 /var/www/sviydlyasvoih/platform-svoi/public/uploads/
```

## Мониторинг

Для мониторинга работы приложения:

```bash
# Логи PM2
pm2 logs sviy-web

# Статус PM2
pm2 status

# Перезагрузка с нуля (если нужно)
pm2 stop sviy-web
pm2 delete sviy-web
pm2 start ecosystem.config.js
```

## Примечание

Все изменения обратно совместимы. Старые изображения продолжат работать корректно, а новые будут отображаться сразу после загрузки.
