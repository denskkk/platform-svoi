# Развертывание системы обмена сообщениями

## Что добавлено

1. **База данных**: таблицы `conversations` и `messages`
2. **API**: 
   - `/api/conversations` - список диалогов, создание диалога
   - `/api/conversations/[id]/messages` - сообщения в диалоге
   - `/api/conversations/unread-count` - счетчик непрочитанных
3. **UI**:
   - Страница `/chat` с диалогами и чатом
   - Кнопка "Написати" на профилях пользователей
   - Счётчик непрочитанных сообщений в навигации

## Шаги развертывания на сервере

### 1. Применить миграцию базы данных

```bash
# Подключиться к серверу
ssh root@your-server

# Перейти в папку проекта
cd /var/www/sviydlyasvoih/platform-svoi

# Применить SQL миграцию
psql -U postgres -d sviydlyasvoyikh -f database/migrations/add_messaging_system.sql
```

### 2. Обновить код на сервере

```bash
# Находясь в папке проекта
git pull origin main

# Установить зависимости (если нужно)
npm install

# Собрать проект
npm run build

# Перезапустить PM2
pm2 restart sviy-web
```

### 3. Проверка

1. Открыть сайт: https://sviydlyasvoih.com.ua
2. Войти в аккаунт
3. Перейти на профиль другого пользователя
4. Нажать кнопку "Написати"
5. Проверить что открылась страница чата
6. Отправить сообщение
7. Проверить что в навигации появился счётчик непрочитанных

## Возможные проблемы

### Ошибка подключения к БД
Убедитесь что PostgreSQL запущен:
```bash
sudo systemctl status postgresql
```

### Миграция не применяется
Проверьте что файл существует:
```bash
ls -la database/migrations/add_messaging_system.sql
```

### Ошибки при сборке
Очистите кеш и пересоберите:
```bash
rm -rf .next
npm run build
```

### PM2 не перезапускается
```bash
pm2 logs sviy-web
pm2 restart sviy-web --update-env
```

## Откат изменений

Если что-то пошло не так, можно откатить миграцию:

```sql
-- Удалить таблицы
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Удалить связи из таблицы users (если они были добавлены)
```

Затем вернуться к предыдущему коммиту:
```bash
git log --oneline  # найти нужный коммит
git reset --hard <commit-hash>
npm run build
pm2 restart sviy-web
```

## Дальнейшие улучшения

- [ ] WebSocket для обновления сообщений в реальном времени
- [ ] Push-уведомления о новых сообщениях
- [ ] Возможность отправки изображений в чате
- [ ] Индикатор "печатает..."
- [ ] Поиск по сообщениям
- [ ] Архивирование/удаление диалогов
