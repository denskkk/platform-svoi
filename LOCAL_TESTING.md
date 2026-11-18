# Локальный запуск для проверки всех функций (от А до Я)

Нужно: Node.js 20+, Docker (для PostgreSQL), ffmpeg (для видео и историй-видео), Git.

## 1. Код
```bash
git clone https://github.com/denskkk/platform-svoi.git   # если уже есть — пропустите
cd platform-svoi
git fetch origin && git checkout feature/social-feed && git pull origin feature/social-feed
npm ci
```

## 2. PostgreSQL (чистая локальная база)
Не используйте `docker-compose.yml` из репозитория (он грузит старую схему). Поднимите отдельный контейнер:
```bash
docker run -d --name svoi-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=svoi -p 5433:5432 postgres:14-alpine
```
(порт 5433, чтобы не конфликтовать с уже установленным Postgres; остановить: `docker stop svoi-pg`, удалить вместе с данными: `docker rm -f svoi-pg`).

## 3. Настройки `.env`
```bash
cp .env.example .env
```
Откройте `.env` и поставьте:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/svoi?schema=public"
JWT_SECRET="любая-длинная-случайная-строка-минимум-32-символа"
REFRESH_TOKEN_SECRET="другая-длинная-случайная-строка"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NODE_ENV="development"
# если ffmpeg не в PATH (Windows):
# FFMPEG_PATH="C:\\ffmpeg\\bin\\ffmpeg.exe"
# FFPROBE_PATH="C:\\ffmpeg\\bin\\ffprobe.exe"
```

## 4. Таблицы и клиент Prisma
На ПУСТОЙ базе достаточно одной команды: она создаёт все таблицы (старые и новые) из `prisma/schema.prisma`. Скрипт `apply_social_update.sh` для чистой базы не нужен (он для сервера, где таблицы уже есть).
```bash
npx prisma db push
npx prisma generate
```
Проверка: `npx prisma studio` — должны быть таблицы deals, referral_programs, clubs, stories, post_videos, notification_settings и др.

## 5. ffmpeg (видео)
- macOS: `brew install ffmpeg`
- Windows: `winget install Gyan.FFmpeg` (затем перезапустите терминал)
- Linux: `sudo apt install ffmpeg`
Проверка: `ffmpeg -version`.

## 6. Запуск
Быстрый вариант (медленнее при первом открытии страниц):
```bash
npm run dev
```
Как на сервере (быстрее, рекомендуется для финальной проверки, ловит ошибки типов):
```bash
npm run build
npm run start
```
Откройте http://localhost:3000.

## 7. Тестовые аккаунты
Зарегистрируйте через `/auth/register` три аккаунта (имя, фамилия, email, пароль), каждый в отдельном окне/профиле браузера (или режим инкогнито):
- **A** — обычный пользователь (`a@test.local`)
- **B** — будущий бизнес (`b@test.local`)
- **Admin** — `admin@test.local`

Сделайте Admin полным администратором (команда выполняется в контейнере Postgres):
```bash
docker exec -it svoi-pg psql -U postgres -d svoi -c "UPDATE users SET is_admin = true WHERE email = 'admin@test.local';"
```
Выйдите и войдите заново админом, чтобы права подтянулись. Открывать `/admin`.

## 8. Проекты (направления)
Если на странице `/projects` пусто или направления «скоро», активируйте их:
```bash
docker exec -i svoi-pg psql -U postgres -d svoi < database/migrations/20261121_activate_listing_projects.sql
docker exec -i svoi-pg psql -U postgres -d svoi < database/migrations/20261122_add_outbound_clicks.sql
docker exec -i svoi-pg psql -U postgres -d svoi < database/migrations/20261123_add_clubs.sql
```
(или `/admin/projects` — включить нужные направления вручную).

## 9. Прогон «от А до Я»
Порядок, при котором каждый шаг подготавливает следующий:
1. **Регистрация и лендинг:** гость открывает `/` (новый лендинг), регистрируется → попадает в `/feed`; переключение uk/en.
2. **Лента (A):** пост с фото; лайк; долгое нажатие на «Подобається» → реакции; комментарий, ответ, лайк комментария; репост («Поділитися» → «Поділитися у стрічці»); закладка.
3. **Друзья и чат:** A подписывается на B и наоборот; `/friends` (вкладки); `/chat` — сообщения между A и B; колокольчик у второго.
4. **Видео:** A → «Відео» в композере, mp4 до 50 МБ → «Обробка відео…» → «Опублікувати»; плеер в ленте; `/video` лента Shorts (автозапуск, лайк, звук).
5. **Истории:** «+» над композером → фото и видео → у B кружок истории → просмотр → у A счётчик просмотров → удаление.
6. **Поиск:** `/search` — текст, город, направление, вкладки «Люди/Компанії/Оголошення/Клуби».
7. **Бизнес (B):** `/business/apply` (логотип, банер, «моё местоположение», процент) → Admin: `/admin/business-applications` → одобрить → `/companies/<id>` у B; кнопки «Написати», маршрут, QR (`/companies/<id>/qr`), «Зберегти», «Поділитися».
8. **Организация:** `/organizations/apply` → Admin: `/admin/organization-applications` → одобрить.
9. **Проекты:** `/projects` → создать объявление в авто, недвижимости, здоровье, спорте, магазинах (ссылка на магазин), событиях → Admin: `/admin/listings` → одобрить → видно в каталоге; «Мої оголошення» → продлить; «Перейти до магазину» считает переход.
10. **Клубы:** `/clubs` → создать (A), вступить/выйти (B).
11. **«Як заробити»:** Admin: `/admin/partners` → вкладка контента: видео-ссылка YouTube, шаги, примеры → `/projects/<slug>/earn`; A подаёт партнёрскую заявку → Admin одобряет.
12. **Рефералы (главное):** Admin: `/admin/deals` → «Програми» → активировать программу для B (процент 5, номер договора). A: `/companies/<id>` → «Скопіювати моє посилання» и «Передати клієнта». B: `/business/clients` → подтвердить сделку с суммой 2000 (комиссия 100 ₴). Admin: «Нарахувати» → «Відмітити виплату». A: `/earnings` — суммы и история. Проверить: нельзя создать сделку с собственной компанией; дубль клиента отклоняется; спор; сумма не меняется после подтверждения.
13. **Статистика бизнеса (B):** `/business/stats`.
14. **Уведомления:** колокольчик на каждом шаге; ⚙ — выключить группу «Лайки…» и убедиться, что новые лайки не считаются.
15. **Роли:** `/admin/roles` → дать роль «Модератор» пользователю A → у A открывается `/admin/staff` (только его разделы).
16. **Профиль:** обложка («Змінити обкладинку»), вкладки-навигация, дописи.
17. **Админка:** `/admin` — пользователи, жалобы (пожаловаться на пост от A), сообщения.

## 10. Если что-то не работает
- Ошибка «relation … does not exist» → не выполнен `npx prisma db push`.
- Видео «не вдалося обробити» → нет ffmpeg в PATH (`ffmpeg -version`) или задайте `FFMPEG_PATH`.
- Файлы (фото/видео) не открываются → папка `public/uploads` создаётся автоматически; убедитесь, что у процесса есть права на запись.
- Нет прав администратора → повторно войдите после `UPDATE users SET is_admin = true`.
- Ошибки сборки TypeScript → пришлите текст целиком.
- Сброс базы: `docker rm -f svoi-pg` и заново пункты 2 и 4.
