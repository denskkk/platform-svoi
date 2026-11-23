// @ts-nocheck
/**
 * Повне демо-наповнення ЛОКАЛЬНОЇ бази для тестування (без інтернету: усі картинки генеруються локально через sharp).
 *   npx tsx prisma/seed-projects.ts            — додати дані (адмін, люди, бізнеси з логотипами й банерами, дописи, історії, рілси,
 *                                                 оголошення в КОЖНІЙ папці всіх проєктів, заявки альянсу, переговори, картинки папок)
 *   npx tsx prisma/seed-projects.ts --reset    — видалити створене цим скриптом (акаунти seedNN@svoi.test) і створити заново
 *   ADMIN_PASSWORD='...' npx tsx prisma/seed-projects.ts   — свій пароль адміна (за замовчуванням Admin12345!)
 * Захист: працює лише з базою на localhost / 127.0.0.1 (для іншої — прапорець --force).
 * Паролі всіх seed-акаунтів: Demo12345. Адмін: admin@svoi.local.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { PROJECT_FOLDERS, sectionLeaves } from '../src/lib/projectFolders';
import { LISTING_FIELDS, visibleFields } from '../src/lib/listingFields';

const prisma = new PrismaClient();
const DAY = 24 * 3600 * 1000;
const ago = (d: number, h = 0) => new Date(Date.now() - d * DAY - h * 3600 * 1000);
const pick = <T,>(a: T[], i: number): T => a[((i % a.length) + a.length) % a.length];
const rnd = (seed: number) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };
const ROOT = process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads');
const msg = (loc: string, f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', loc, f), 'utf8'));
const L = msg('uk', 'listings.json');
const SECTION_LABEL: Record<string, string> = L.options.section;

const GRADS: Array<[string, string]> = [['#0a1f44', '#2563eb'], ['#1e3a8a', '#f59e0b'], ['#065f46', '#34d399'], ['#7c2d12', '#fb923c'], ['#581c87', '#c084fc'], ['#134e4a', '#2dd4bf'], ['#831843', '#f472b6'], ['#1e293b', '#64748b'], ['#14532d', '#a3e635'], ['#7f1d1d', '#f87171']];
const esc = (s: string) => s.replace(/[<>&"']/g, ' ');

/** Малює градієнтну картинку з текстом і зберігає в <uploads>/<dir>/<name>; повертає URL виду /uploads/<dir>/<name> */
async function img(dir: string, name: string, w: number, h: number, seed: number, text = '', circle = false): Promise<string> {
  const [a, b] = pick(GRADS, seed);
  const fs_ = Math.round(Math.min(w, h) * (circle ? 0.45 : 0.14));
  const lines = (text || '').slice(0, 40);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`
    + `<rect width="100%" height="100%" fill="url(#g)"/><circle cx="${w * 0.82}" cy="${h * 0.2}" r="${Math.min(w, h) * 0.22}" fill="#fff" fill-opacity=".10"/><circle cx="${w * 0.15}" cy="${h * 0.9}" r="${Math.min(w, h) * 0.3}" fill="#fff" fill-opacity=".08"/>`
    + `<text x="50%" y="54%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${fs_}" fill="#fff">${esc(lines)}</text></svg>`;
  const dirPath = path.join(ROOT, dir);
  fs.mkdirSync(dirPath, { recursive: true });
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 78 }).toBuffer();
  fs.writeFileSync(path.join(dirPath, name), buf);
  return `/uploads/${dir}/${name}`;
}

const PEOPLE: Array<[string, string, 'female' | 'male', string, string, string]> = [
  ['Олена', 'Коваленко', 'female', 'Київ', 'Київська', 'Мама двох, люблю подорожі та каву.'], ['Марія', 'Шевченко', 'female', 'Львів', 'Львівська', 'Фотографую Львів і печу сирники.'],
  ['Ірина', 'Бондаренко', 'female', 'Харків', 'Харківська', 'Вчителька, в’яжу шарфи для військових.'], ['Наталія', 'Мельник', 'female', 'Одеса', 'Одеська', 'Одеса — мій дім. Море і гарні історії.'],
  ['Світлана', 'Ткаченко', 'female', 'Дніпро', 'Дніпропетровська', 'Бухгалтер, допомагаю з документами.'], ['Юлія', 'Кравчук', 'female', 'Варшава', 'Польща', 'Живу у Варшаві з 2022, допомагаю землякам.'],
  ['Оксана', 'Лисенко', 'female', 'Краків', 'Польща', 'Краків, кава, українська кухня.'], ['Анна', 'Поліщук', 'female', 'Берлін', 'Німеччина', 'Дизайнерка в Берліні.'],
  ['Андрій', 'Мороз', 'male', 'Київ', 'Київська', 'IT, велосипед і риболовля.'], ['Віктор', 'Гончар', 'male', 'Львів', 'Львівська', 'Будівельник, ремонти під ключ.'],
  ['Дмитро', 'Руденко', 'male', 'Харків', 'Харківська', 'Таксист і любитель авто.'], ['Сергій', 'Бойко', 'male', 'Одеса', 'Одеська', 'Рибалка. Покажу, де клює.'],
  ['Олександр', 'Петренко', 'male', 'Варшава', 'Польща', 'Логіст, доставка з Польщі в Україну.'], ['Іван', 'Верес', 'male', 'Краків', 'Польща', 'Програмувальник, футбол, мандрівки.'],
  ['Петро', 'Саєнко', 'male', 'Полтава', 'Полтавська', 'Фермер: зерно, соняшник, ріпак. Шукаю покупців.'], ['Галина', 'Мазур', 'female', 'Вінниця', 'Вінницька', 'Ягідне господарство: полуниця, малина.'],
];
// назва, місто, регіон, категорія, тип, опис, власник (ім'я, прізвище, стать)
const BUSINESS: Array<[string, string, string, string, string, string, string, string, 'female' | 'male']> = [
  ['Фітнес-студія «Сила»', 'Київ', 'Київська', 'Спорт', 'Фітнес і тренування', 'Тренування онлайн і офлайн.', 'Максим', 'Кушнір', 'male'],
  ['Клініка доктора Гриценко', 'Львів', 'Львівська', 'Здоров’я', 'Лікар-кардіолог', 'Консультації у Львові та онлайн.', 'Анна', 'Гриценко', 'female'],
  ['Автосалон «АвтоСвій»', 'Дніпро', 'Дніпропетровська', 'Авто', 'Автосалон', 'Авто з Європи та пробігом по Україні.', 'Богдан', 'Ярмоленко', 'male'],
  ['Агентство «Домівка»', 'Варшава', 'Польща', 'Нерухомість', 'Агентство нерухомості', 'Оренда та купівля житла у Польщі.', 'Катерина', 'Гнатюк', 'female'],
  ['Крамниця «Смак України»', 'Львів', 'Львівська', 'Продукти', 'Українська продукція', 'Сало, ковбаси, мед і сири від фермерів.', 'Роман', 'Стадник', 'male'],
  ['Адвокат Олег Данильченко', 'Київ', 'Київська', 'Юристи', 'Адвокат', 'Сімейне та трудове право.', 'Олег', 'Данильченко', 'male'],
  ['«АгроТрейд Україна»', 'Київ', 'Київська', 'Агро', 'Трейдер зерна', 'Експорт зерна, постачання добрив і пального.', 'Марина', 'Литвин', 'female'],
  ['Логістика «ЄвроШлях»', 'Варшава', 'Польща', 'Логістика', 'Міжнародні перевезення', 'Рефрижератори, зерновози, збірні вантажі.', 'Тарас', 'Коваль', 'male'],
  ['Салон краси «Лілія»', 'Одеса', 'Одеська', 'Краса', 'Салон краси', 'Перукарі, манікюр, косметологія.', 'Лілія', 'Остапчук', 'female'],
  ['Турагенція «Світ своїх»', 'Київ', 'Київська', 'Подорожі', 'Турагенція', 'Тури й квитки для своїх.', 'Віталій', 'Сидоренко', 'male'],
];
const POSTS = ['Доброго ранку, свої! ☀️ Як ваші плани? #свої', 'Сьогодні зустрілися зі своїми на каві ☕ #зустріч', 'Хто знає гарного майстра у Львові? Підкажіть 🙏', 'Нові фото з вихідних — природа лікує 🌲',
  'Печу хліб за бабусиним рецептом 🍞 #рецепт', 'Збираємо допомогу для ЗСУ 💙💛 Приєднуйтесь!', 'Нарешті відкрила свою справу! Дякую всім ✨', 'Рибалка вдалася! 🎣', 'Шукаю своїх у Варшаві — зберемося у вихідні!',
  'Ярмарок української продукції — смакота 🥖', 'Допоможу з документами та перекладом 🤝', 'Урожай цього року — рекордний 🌾 Шукаю покупців!'];
const COMMENTS = ['Круто! 👏', 'Дякую, що ділитесь!', 'Підтримую!', 'Гарні фото 😍', 'Дуже цікаво 🙂', 'Так тримати!'];
const REELS = ['https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 'https://download.samplelib.com/mp4/sample-10s.mp4', 'https://download.samplelib.com/mp4/sample-5s.mp4', 'https://www.w3schools.com/html/mov_bbb.mp4'];
const CITIES = ['Київ', 'Львів', 'Харків', 'Одеса', 'Дніпро', 'Варшава', 'Краків', 'Берлін', 'Полтава', 'Вінниця'];
const COUNTRY_OF: Record<string, string> = { Варшава: 'Польща', Краків: 'Польща', Берлін: 'Німеччина' };
const REGION_OF: Record<string, string> = { Київ: 'Київська', Львів: 'Львівська', Харків: 'Харківська', Одеса: 'Одеська', Дніпро: 'Дніпропетровська', Полтава: 'Полтавська', Вінниця: 'Вінницька', Варшава: 'Мазовецьке', Краків: 'Малопольське', Берлін: 'Берлін' };
const POOL: Record<string, string[]> = {
  make: ['Toyota', 'Volkswagen', 'Skoda', 'Renault'], model: ['Camry', 'Golf', 'Octavia', 'Duster'], brand: ['Bosch', 'Samsung', 'Nike', 'Xiaomi'], destination: ['Карпати', 'Єгипет', 'Туреччина', 'Польща', 'Італія'],
  languages: ['українська, англійська', 'українська, польська', 'українська, німецька'], profession: ['Підприємець', 'Лікар', 'Фермер', 'Інженер'], producedGoods: ['пшениця, соняшник', 'полуниця, малина', 'яблука, груші', 'свинина'],
  area: ['120 га', '35 га', '8 га', '500 га'], volume: ['500 т', '120 т', '20 т', '1000 т'], season: ['липень–серпень', 'вересень–жовтень', 'весь рік'], priceInfo: ['за запитом', 'від 8 000 грн/т', 'від 250 $/т'],
  sphere: ['переробка', 'гуртова торгівля', 'торгова мережа'], buys: ['зерно, олійні', 'овочі, фрукти', 'м’ясо, молоко'], routes: ['Україна — ЄС', 'Польща — Україна', 'Одеса — Констанца'], cargoInfo: ['рефрижератор 20 т', 'зерновоз 30 т', 'тент 22 т'],
  country: ['Україна', 'Польща', 'Німеччина'], region: ['Київська', 'Львівська', 'Одеська', 'Полтавська'], regDocNumber: ['UA-2026-0412', 'PL-REG-77311'], channelUrl: ['https://example.com/channel'], practice: ['tarot', 'astrology'],
};

function readEnv() {
  for (const f of ['.env.local', '.env']) {
    try {
      const m = fs.readFileSync(path.join(process.cwd(), f), 'utf8').match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
      if (m && !process.env.DATABASE_URL) process.env.DATABASE_URL = m[1];
    } catch { /* немає файлу */ }
  }
}

async function main() {
  readEnv();
  const dbUrl = process.env.DATABASE_URL || '';
  const force = process.argv.includes('--force');
  const local = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(dbUrl) || /^postgres(ql)?:\/\/(localhost|127\.0\.0\.1)/.test(dbUrl);
  if (!force && (process.env.NODE_ENV === 'production' || !local)) { console.error('СТОП: скрипт лише для локальної бази (localhost). Для іншої — додайте --force, якщо ви впевнені.'); process.exit(1); }

  if (process.argv.includes('--reset')) {
    const del = await prisma.user.deleteMany({ where: { email: { startsWith: 'seed', endsWith: '@svoi.test' } } });
    console.log(`Видалено seed-акаунтів: ${del.count}`);
  }

  // ---- Адмін ----
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin12345!';
  const adminHash = await bcrypt.hash(adminPass, 10);
  const adminEmail = 'admin@svoi.local';
  const adm = await prisma.user.findFirst({ where: { email: { equals: adminEmail, mode: 'insensitive' } } });
  if (adm) await prisma.user.update({ where: { id: adm.id }, data: { passwordHash: adminHash, isAdmin: true, role: 'admin', isActive: true, isVerified: true } });
  else await prisma.user.create({ data: { email: adminEmail, passwordHash: adminHash, firstName: 'Адміністратор', lastName: 'Платформи', role: 'admin', accountType: 'basic', isAdmin: true, isActive: true, isVerified: true, city: 'Київ' } });

  if (await prisma.user.findFirst({ where: { email: 'seed01@svoi.test' }, select: { id: true } })) {
    console.log('Seed-дані вже є. Щоб створити заново: npx tsx prisma/seed-projects.ts --reset');
    console.log(`Адмін: ${adminEmail} / ${adminPass}`);
    return;
  }
  const hash = await bcrypt.hash('Demo12345', 10);
  let n = 0;
  const people: any[] = []; const biz: any[] = [];
  for (const [i, p] of PEOPLE.entries()) {
    n += 1; const tag = String(n).padStart(2, '0');
    const avatar = await img('avatars', `seed_a${tag}.jpg`, 400, 400, i, p[0][0] + p[1][0], true);
    const cover = await img('banners', `seed_c${tag}.jpg`, 1200, 400, i + 3, p[3]);
    people.push(await prisma.user.create({ data: { email: `seed${tag}@svoi.test`, passwordHash: hash, firstName: p[0], lastName: p[1], gender: p[2], city: p[3], region: p[4], bio: p[5], avatarUrl: avatar, coverUrl: cover, isActive: true, isVerified: i % 3 === 0 } }));
  }
  for (const [i, b] of BUSINESS.entries()) {
    n += 1; const tag = String(n).padStart(2, '0');
    const avatar = await img('avatars', `seed_a${tag}.jpg`, 400, 400, i + 5, b[6][0] + b[7][0], true);
    const logo = await img('logos', `seed_l${tag}.jpg`, 400, 400, i + 1, b[0].replace(/[«»]/g, '').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase(), true);
    const banner = await img('banners', `seed_b${tag}.jpg`, 1200, 400, i + 2, b[0].replace(/[«»]/g, ''));
    const u = await prisma.user.create({ data: { email: `seed${tag}@svoi.test`, passwordHash: hash, firstName: b[6], lastName: b[7], gender: b[8], city: b[1], region: b[2], avatarUrl: avatar, coverUrl: banner, role: 'business', accountType: 'business', isActive: true, isVerified: true } });
    await prisma.businessInfo.create({ data: { userId: u.id, companyName: b[0], city: b[1], region: b[2], businessType: b[4], businessCategory: b[3], description: b[5], logoUrl: logo, bannerUrl: banner, address: `${b[1]}, вул. Центральна, ${10 + i}` } });
    biz.push(u);
  }
  const everyone = [...people, ...biz];
  console.log(`Акаунтів: ${everyone.length} (з аватарами, обкладинками, логотипами й банерами)`);

  // ---- Підписки, дописи, лайки, коментарі ----
  const follows: any[] = [];
  everyone.forEach((u, i) => { for (let k = 1; k <= 8; k++) { const v = everyone[(i + k * 2 + 1) % everyone.length]; if (v.id !== u.id) follows.push({ followerId: u.id, followingId: v.id }); } });
  await prisma.follow.createMany({ data: follows, skipDuplicates: true });
  const posts: any[] = []; let pi = 0;
  for (const [i, u] of everyone.entries()) {
    for (let k = 0; k < 3; k++) {
      const post = await prisma.post.create({ data: { authorId: u.id, content: pick(POSTS, i * 3 + k), createdAt: ago(Math.floor(pi / 3), (pi * 5) % 23) } });
      const imgs = k % 2; // половина дописів з фото
      for (let p = 0; p <= imgs; p++) await prisma.postImage.create({ data: { postId: post.id, url: await img('posts', `seed_p${post.id}_${p}.jpg`, 900, 700, pi + p, pick(POSTS, pi).slice(0, 24)), position: p } });
      posts.push(post); pi += 1;
    }
  }
  for (const [i, post] of posts.entries()) {
    const likers = everyone.filter((u, j) => u.id !== post.authorId && (j + i) % 3 === 0).slice(0, 8);
    await prisma.postLike.createMany({ data: likers.map((u) => ({ postId: post.id, userId: u.id })), skipDuplicates: true });
    const cm = everyone.filter((u, j) => u.id !== post.authorId && (j + i) % 7 === 0).slice(0, 3);
    for (const [c, u] of cm.entries()) await prisma.postComment.create({ data: { postId: post.id, authorId: u.id, content: pick(COMMENTS, i + c) } });
    await prisma.post.update({ where: { id: post.id }, data: { likesCount: likers.length, commentsCount: cm.length } });
  }
  // ---- Рілси (відео за посиланням) ----
  for (const [i, u] of everyone.slice(0, 12).entries()) {
    const post = await prisma.post.create({ data: { authorId: u.id, content: pick(['Ранкова пробіжка 🏃 #спорт', 'Готуємо вареники 🥟', 'Огляд авто 🚘', 'Подорож вихідного дня ✈️'], i), createdAt: ago(i % 5, i) } });
    await prisma.postVideo.create({ data: { ownerId: u.id, postId: post.id, status: 'ready', url: pick(REELS, i), posterUrl: null, durationSec: 10 } });
  }
  // ---- Історії (24 години) ----
  for (const [i, u] of everyone.entries()) {
    for (let k = 0; k < 1 + (i % 2); k++) await prisma.story.create({ data: { ownerId: u.id, mediaType: 'image', mediaUrl: await img('posts', `seed_s${u.id}_${k}.jpg`, 720, 1280, i + k, pick(['Доброго дня!', 'Мій вечір', 'Нова робота', 'Зустріч зі своїми'], i + k)), caption: pick(['Доброго дня! ☀️', 'Мій вечір 🌇', 'Нова робота 💼', 'Зустріч зі своїми 🤝'], i + k), expiresAt: new Date(Date.now() + (12 + (i % 10)) * 3600 * 1000), createdAt: ago(0, i % 10) } });
  }
  console.log(`Дописів: ${posts.length}, рілсів: 12, історій: ${everyone.length + Math.floor(everyone.length / 2)}`);

  // ---- Оголошення в кожній папці кожного проєкту ----
  let ads = 0;
  const exp = new Date(Date.now() + 60 * DAY);
  for (const slug of Object.keys(LISTING_FIELDS)) {
    if (!(PROJECT_FOLDERS[slug] || []).length) continue;
    for (const leaf of sectionLeaves(slug)) {
      const label = SECTION_LABEL[leaf.id] || leaf.id;
      const fields = visibleFields(slug, leaf.id);
      for (let v = 0; v < 2; v++) {
        const seed = ads + 1;
        const owner = leaf.business ? pick(biz, seed) : pick(people, seed);
        const city = pick(CITIES, seed + v);
        const data: Record<string, any> = { section: leaf.id, seed: true };
        Object.assign(data, leaf.derive || {});
        for (const f of fields) {
          if (data[f.key] !== undefined) continue;
          if (f.key === 'country') { data.country = COUNTRY_OF[city] || 'Україна'; continue; }
          if (f.key === 'region') { data.region = REGION_OF[city] || 'Київська'; continue; }
          if (f.type === 'select' && f.options?.length) data[f.key] = f.key === 'adKind' ? (v ? 'request' : 'offer') : f.key === 'visibility' ? 'open' : pick(f.options, seed + v);
          else if (f.type === 'number') data[f.key] = Math.round((f.min ?? 1) + rnd(seed + v + f.key.length) * (Math.min(f.max ?? 100, (f.min ?? 1) + 200) - (f.min ?? 1)));
          else if (f.type === 'date') data[f.key] = new Date(Date.now() + (7 + (seed % 40)) * DAY).toISOString().slice(0, 10);
          else if (f.type === 'url') data[f.key] = 'https://example.com';
          else data[f.key] = (POOL[f.key] ? pick(POOL[f.key], seed + v) : `Демо ${f.key}`).slice(0, f.maxLength || 150);
        }
        if (data.adKind === undefined) delete data.adKind;
        const listing = await prisma.listing.create({
          data: {
            projectSlug: slug, ownerId: owner.id, title: `${label.slice(0, 90)} — ${v ? 'шукаю' : 'пропоную'} №${v + 1}`.slice(0, 150),
            description: `Демо-оголошення в розділі «${label}». Опис, умови та контакти — для перевірки каталогу, фільтрів і карток.`,
            price: leaf.business ? null : Math.round(100 + rnd(seed) * 9900), currency: pick(['UAH', 'USD', 'EUR'], seed), city, contactName: owner.firstName, data, status: 'approved', expiresAt: exp, createdAt: ago(seed % 20),
            images: { create: [{ url: await img('listings', `seed_${ads}.jpg`, 800, 600, seed, label.slice(0, 22)), position: 0 }] },
          },
        });
        ads += 1;
      }
    }
    process.stdout.write(`  ${slug}: ok\n`);
  }
  console.log(`Оголошень: ${ads}`);

  // ---- Заявки проєктів (альянс та ін.) ----
  const sug = (userId: number, projectSlug: string, kind: string, status: string, text: string, days = 1) => prisma.projectSuggestion.create({ data: { userId, projectSlug, kind, status, text, createdAt: ago(days) } });
  const farmer = people[14], berry = people[15], buyer = biz[6];
  await sug(farmer.id, 'export-alliance', 'request', 'published', '[Створити нову заявку] Назва продукції: Пшениця 3 клас | Обсяг: 2000 т | Мінімальна партія: 100 т | Форма продукції: свіжа | Країна: Україна | Область: Полтавська | Бажаний ринок: Європа | Ціна та валюта: 220 $/т FOB | Телефон: +380501112233', 3);
  await sug(farmer.id, 'export-alliance', 'request', 'published', '[Створити нову заявку] Назва продукції: Соняшник | Обсяг: 800 т | Форма продукції: суха | Країна: Україна | Область: Полтавська | Бажаний ринок: Польща, Німеччина | Телефон: +380501112233', 5);
  await sug(berry.id, 'export-alliance', 'request', 'published', '[Створити нову заявку] Назва продукції: Полуниця (заморожена) | Обсяг: 40 т | Форма продукції: заморожена | Країна: Україна | Область: Вінницька | Бажаний ринок: Німеччина | Телефон: +380671234567', 2);
  await sug(berry.id, 'export-alliance', 'request', 'offers', '[Створити нову заявку] Назва продукції: Малина | Обсяг: 15 т | Форма продукції: свіжа | Країна: Україна | Телефон: +380671234567', 6);
  await sug(farmer.id, 'export-alliance', 'request', 'review', '[Створити нову заявку] Назва продукції: Ріпак | Обсяг: 500 т | Країна: Україна | Телефон: +380501112233', 1);
  await sug(buyer.id, 'export-alliance', 'specialist', 'new', '[Стати представником] Ім’я: Марина Литвин | Країна: Польща | Мови: українська, польська | Досвід: 8 років | Телефон: +48123456789', 1);
  await sug(people[12].id, 'export-alliance', 'request', 'clarify', '[Розрахувати маршрут] Звідки: Варшава | Куди: Київ | Товар: Добрива | Обсяг: 60 т | Тип транспорту: тент | Телефон: +48600111222', 2);
  await sug(people[0].id, 'export-alliance', 'suggestion', 'new', '[Запропонувати покращення платформи] Додати фільтр за сертифікатами.', 1);
  await sug(people[1].id, 'export-alliance', 'complaint', 'review', '[Скарга на оголошення] Дублюється оголошення в категорії «Добрива».', 2);
  for (const [i, slug] of ['dating', 'mystic', 'grants', 'beauty', 'notable', 'media-network', 'cooperatives', 'apps', 'rebuild'].entries()) {
    await sug(pick(people, i).id, slug, 'consult', 'new', `[Консультація] Хочу дізнатися більше про проєкт «${slug}». Телефон: +38050000000${i}`, i % 4);
    await sug(pick(people, i + 3).id, slug, 'suggestion', 'done', `[Пропозиція] Додати нову категорію в проєкт «${slug}».`, 3 + (i % 4));
  }

  // ---- Переговори ----
  const negs: Array<[any, any, string, string, string[]]> = [
    [farmer, buyer, 'Поставка пшениці, 2000 т', 'active', ['Добрий день! Пропоную 220 $/т FOB.', 'Дякую, потрібно уточнити якість та терміни.', 'Протеїн 12,5%, відвантаження у вересні.']],
    [berry, biz[4], 'Заморожена полуниця для крамниці', 'open', ['Зацікавлені в партії від 5 т. Ціна?']],
    [people[12], biz[7], 'Перевезення добрив Варшава — Київ', 'agreed', ['Потрібен тент 22 т.', 'Підходить, 1800 € за рейс.', 'Погоджуємо.']],
  ];
  for (const [a, b, title, status, texts] of negs) {
    const ng = await prisma.negotiation.create({ data: { projectSlug: 'export-alliance', creatorId: a.id, partnerId: b.id, title, product: title.slice(0, 60), volume: '—', price: 'за домовленістю', payTerms: 'акредитив', delivery: 'FOB / DAP', status, creatorAgreed: status === 'agreed', partnerAgreed: status === 'agreed' } });
    for (const [i, text] of texts.entries()) await prisma.negotiationMessage.create({ data: { negotiationId: ng.id, authorId: i % 2 ? b.id : a.id, kind: 'text', text, createdAt: ago(1, 5 - i) } });
  }

  // ---- Картинки головних папок кожного проєкту (лише там, де ще немає) ----
  let tiles = 0;
  for (const slug of Object.keys(PROJECT_FOLDERS)) {
    for (const [i, f] of (PROJECT_FOLDERS[slug] || []).entries()) {
      const exists = await prisma.folderImage.findFirst({ where: { project: slug, path: f.key }, select: { id: true } });
      if (exists) continue;
      const label = (L.options.section[`${slug.replace(/-/g, '_')}_${f.key}`] || f.key);
      await prisma.folderImage.create({ data: { project: slug, path: f.key, imageUrl: await img('misc', `seed_f_${slug}_${f.key}.jpg`, 600, 600, i + slug.length, String(label).slice(0, 18)) } });
      tiles += 1;
    }
  }
  console.log(`Картинок папок: ${tiles}`);
  console.log(`\nГОТОВО.\n  Адмін:     ${adminEmail} / ${adminPass}\n  Користувачі: seed01@svoi.test … seed${String(n).padStart(2, '0')}@svoi.test / Demo12345\n  Бізнес-акаунти: seed17…seed26@svoi.test, фермер: seed15, ягідник: seed16\n`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
