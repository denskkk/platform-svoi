/**
 * Демо-наповнення соцмережі: люди з фото, історії, дописи, рілси, бізнеси, оголошення, клуби, групові чати, рахунки.
 *   node prisma/seed-demo.js          — додати демо-дані (пароль усіх: Demo12345, пошта demoNN@svoi.test)
 *   node prisma/seed-demo.js --reset  — видалити демо-дані (усі акаунти @svoi.test) і створити заново
 * Фото: randomuser.me (портрети) і picsum.photos (картинки); відео: публічні зразки Google. Потрібен інтернет у браузері.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const DAY = 24 * 3600 * 1000;
const ago = (days, hours = 0) => new Date(Date.now() - days * DAY - hours * 3600 * 1000);
const pick = (arr, i) => arr[i % arr.length];
const pic = (seed, w = 900, h = 700) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const portrait = (g, n) => `https://randomuser.me/api/portraits/${g === 'female' ? 'women' : 'men'}/${n}.jpg`;
// Перевірені відкриті відео (Google sample-bucket більше не віддає файли — 403). Усі відтворюються в браузері.
const REELS = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://download.samplelib.com/mp4/sample-10s.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
  'https://download.samplelib.com/mp4/sample-15s.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://filesamples.com/samples/video/mp4/sample_640x360.mp4',
  'https://download.samplelib.com/mp4/sample-5s.mp4',
  'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
];

// first, last, gender, portrait#, city, region, age, bio
const PEOPLE = [
  ['Олена', 'Коваленко', 'female', 12, 'Київ', 'Київська', 34, 'Мама двох, люблю подорожі та каву. Допомагаю землякам знаходити своїх.'],
  ['Марія', 'Шевченко', 'female', 44, 'Львів', 'Львівська', 29, 'Фотографую Львів і печу сирники. Шукаю своїх у Європі.'],
  ['Ірина', 'Бондаренко', 'female', 65, 'Харків', 'Харківська', 41, 'Вчителька, в’яжу шарфи для військових. Клуб в’язання — запрошую!'],
  ['Наталія', 'Мельник', 'female', 31, 'Одеса', 'Одеська', 38, 'Одеса — мій дім. Люблю море, рибу і гарні історії.'],
  ['Світлана', 'Ткаченко', 'female', 8, 'Дніпро', 'Дніпропетровська', 46, 'Бухгалтер. Допомагаю з документами для переїзду.'],
  ['Юлія', 'Кравчук', 'female', 55, 'Варшава', 'Польща', 32, 'Живу у Варшаві з 2022. Допомагаю українцям з житлом і роботою.'],
  ['Оксана', 'Лисенко', 'female', 23, 'Краків', 'Польща', 36, 'Краків, кава, українська кухня. Збираю своїх на зустрічі.'],
  ['Анна', 'Поліщук', 'female', 70, 'Берлін', 'Німеччина', 27, 'Дизайнерка в Берліні. Шукаю українські ярмарки.'],
  ['Тетяна', 'Савченко', 'female', 17, 'Київ', 'Київська', 52, 'Люблю город, закрутки та добрі справи.'],
  ['Андрій', 'Мороз', 'male', 32, 'Київ', 'Київська', 37, 'IT, велосипед і риболовля у вихідні.'],
  ['Віктор', 'Гончар', 'male', 52, 'Львів', 'Львівська', 45, 'Будівельник. Роблю ремонти під ключ.'],
  ['Дмитро', 'Руденко', 'male', 18, 'Харків', 'Харківська', 31, 'Таксист і любитель авто. Знаю кожну вулицю.'],
  ['Сергій', 'Бойко', 'male', 75, 'Одеса', 'Одеська', 49, 'Рибалка. Покажу, де клює.'],
  ['Олександр', 'Петренко', 'male', 4, 'Варшава', 'Польща', 35, 'Логіст. Допоможу з доставкою з Польщі в Україну.'],
  ['Іван', 'Верес', 'male', 61, 'Краків', 'Польща', 28, 'Програмувальник, футбол, мандрівки.'],
];
// назва компанії, перша/остання, gender, portrait, місто, регіон, категорія, тип, опис
const BUSINESS = [
  ['Фітнес-студія «Сила»', 'Максим', 'Кушнір', 'male', 22, 'Київ', 'Київська', 'Спорт', 'Фітнес і тренування', 'Персональні та групові тренування онлайн і офлайн. Набираємо групи по 15 людей на місяць.'],
  ['Кардіолог Анна Гриценко', 'Анна', 'Гриценко', 'female', 36, 'Львів', 'Львівська', 'Здоров’я', 'Лікар-кардіолог', 'Приймаю у Львові та онлайн. Досвід 14 років. Консультації для українців за кордоном.'],
  ['Дієтолог Лілія Остапчук', 'Лілія', 'Остапчук', 'female', 58, 'Одеса', 'Одеська', 'Здоров’я', 'Дієтолог', 'Курси харчування на місяць, групи по 20 осіб. Без жорстких дієт.'],
  ['Автосалон «АвтоСвій»', 'Богдан', 'Ярмоленко', 'male', 41, 'Дніпро', 'Дніпропетровська', 'Авто', 'Автосалон', 'Авто з Європи та пробігом по Україні. Перевірені історії, чесні ціни.'],
  ['Агентство нерухомості «Домівка»', 'Катерина', 'Гнатюк', 'female', 28, 'Варшава', 'Польща', 'Нерухомість', 'Агентство нерухомості', 'Оренда та купівля житла у Польщі для українців. Допомога з договорами.'],
  ['Крамниця «Смак України»', 'Роман', 'Стадник', 'male', 68, 'Львів', 'Львівська', 'Продукти', 'Українська продукція', 'Справжнє українське сало, ковбаси, мед та сири від фермерів. Відправка в ЄС.'],
  ['Адвокат Олег Данильченко', 'Олег', 'Данильченко', 'male', 83, 'Київ', 'Київська', 'Юристи', 'Адвокат', 'Консультації з сімейного та трудового права, документи для виїзду.'],
];

const POST_TEXTS = [
  'Доброго ранку, свої! ☀️ Як ваші плани на сьогодні? #добрийранок #свої',
  'Сьогодні зустрілися зі своїми на каві. Так приємно відчувати підтримку! ☕ #зустріч #свої',
  'Хто знає гарного майстра з ремонту у Львові? Підкажіть, будь ласка 🙏 #допомога #Львів',
  'Нові фото з вихідних — природа лікує 🌲 #мандрівки #природа',
  'Печу вдома хліб за бабусиним рецептом. Хто хоче рецепт? 🍞 #рецепт #домашнє',
  'Збираємо речі для ЗСУ. Приєднуйтесь, кожна допомога важлива 💙💛 #допомога #свої',
  'Нарешті відкрила свою справу! Дякую всім, хто підтримав ✨ #бізнес #успіх',
  'Рибалка вдалася! Ранок на річці — найкращий ранок 🎣 #риболовля #вихідні',
  'Шукаю своїх у Варшаві — давайте зберемося у вихідні! #Варшава #знайомства',
  'Вчимо дітей українській мові вдома. Поради від мам, діліться своїми 📚 #діти #мова',
  'Допоможу з документами та перекладом — пишіть у особисті 🤝 #послуги',
  'Ярмарок української продукції — чудовий настрій і смачна їжа! 🥖 #ярмарок #смак',
];
const COMMENTS = ['Круто! 👏', 'Дякую, що ділитесь!', 'Дуже цікаво 🙂', 'Підтримую!', 'Гарні фото 😍', 'Так, повністю згодна', 'А де це? Хочу теж!', 'Молодці, свої! 💙💛'];
const REEL_CAPS = [
  'Ранкова пробіжка по місту 🏃 #спорт #ранок', 'Готуємо вареники разом 🥟 #кухня #свої', 'Подорож вихідного дня 🚗 #мандрівки',
  'Огляд нового авто — що думаєте? 🚘 #авто', 'Тренування вдома за 15 хвилин 💪 #фітнес', 'Рибалка на світанку 🎣 #риболовля',
  'Куди поїхати на вихідні? #мандрівки', 'Ремонт своїми руками 🔧 #майстер', 'Український ярмарок у Варшаві 🇺🇦 #ярмарок',
  'Закрутки на зиму 🥒 #домашнє', 'Танці зі своїми 💃 #танці', 'Як ми святкували 🎉 #свято',
];
const STORY_CAPS = ['Доброго дня! ☀️', 'Мій вечір 🌇', 'Нова робота 💼', 'Зустріч зі своїми 🤝', 'Смачна вечеря 🍲', 'Вихідні 🏞️', 'Мої діти 💙', 'Кава ☕'];

async function main() {
  // Ремонт: старі демо-відео зі зламаними посиланнями замінюємо на робочі (без перестворення даних)
  const broken = await prisma.postVideo.findMany({ where: { url: { contains: 'gtv-videos-bucket' } }, select: { id: true } });
  for (const [i, v] of broken.entries()) await prisma.postVideo.update({ where: { id: v.id }, data: { url: REELS[i % REELS.length], posterUrl: null } });
  const noBanner = await prisma.businessInfo.findMany({ where: { bannerUrl: null, user: { email: { endsWith: '@svoi.test' }, coverUrl: { not: null } } }, select: { id: true, user: { select: { coverUrl: true } } } });
  for (const b of noBanner) await prisma.businessInfo.update({ where: { id: b.id }, data: { bannerUrl: b.user.coverUrl } });
  if (noBanner.length) console.log(`Додано банери компаніям: ${noBanner.length}`);
  if (broken.length) console.log(`Замінено зламаних відео: ${broken.length}`);
  if (process.argv.includes('--reset')) {
    const del = await prisma.user.deleteMany({ where: { email: { endsWith: '@svoi.test' } } });
    console.log(`Видалено демо-акаунтів: ${del.count}`);
  }
  if (await prisma.user.findFirst({ where: { email: 'demo01@svoi.test' }, select: { id: true } })) {
    console.log('Демо-дані вже є. Щоб створити заново: node prisma/seed-demo.js --reset');
    return;
  }
  const passwordHash = await bcrypt.hash('Demo12345', 10);
  let n = 0;
  const mk = async (data, business) => {
    n += 1;
    const email = `demo${String(n).padStart(2, '0')}@svoi.test`;
    const u = await prisma.user.create({
      data: { ...data, email, passwordHash, isActive: true, ...(business ? { role: 'business', accountType: 'business', isVerified: true } : {}) },
    });
    if (business) {
      await prisma.businessInfo.create({ data: { userId: u.id, companyName: business.company, city: data.city, region: data.region, businessType: business.type, businessCategory: business.category, description: business.desc, logoUrl: data.avatarUrl, bannerUrl: data.coverUrl } });
    }
    return u;
  };

  // ---- Люди ----
  const people = [];
  for (const [i, p] of PEOPLE.entries()) {
    people.push(await mk({ firstName: p[0], lastName: p[1], gender: p[2], avatarUrl: portrait(p[2], p[3]), coverUrl: pic(`cover${i}`, 1200, 400), city: p[4], region: p[5], age: p[6], bio: p[7] }));
  }
  const biz = [];
  for (const [i, b] of BUSINESS.entries()) {
    biz.push(await mk({ firstName: b[1], lastName: b[2], gender: b[3], avatarUrl: portrait(b[3], b[4]), coverUrl: pic(`bizcover${i}`, 1200, 400), city: b[5], region: b[6], bio: b[9], age: 40 }, { company: b[0], category: b[7], type: b[8], desc: b[9] }));
  }
  const everyone = [...people, ...biz];
  console.log(`Створено акаунтів: ${everyone.length}`);

  // ---- Підписки ----
  const follows = [];
  everyone.forEach((u, i) => {
    for (let k = 1; k <= 9; k++) {
      const v = everyone[(i + k * 2 + 1) % everyone.length];
      if (v.id !== u.id) follows.push({ followerId: u.id, followingId: v.id });
    }
  });
  await prisma.follow.createMany({ data: follows, skipDuplicates: true });

  // ---- Дописи (текст + фото) ----
  const posts = [];
  let t = 0;
  for (const [i, u] of everyone.entries()) {
    const count = 2 + (i % 3);
    for (let k = 0; k < count; k++) {
      const post = await prisma.post.create({ data: { authorId: u.id, content: pick(POST_TEXTS, i * 3 + k), createdAt: ago(Math.floor(t / 3), (t * 5) % 23) } });
      t += 1;
      if ((i + k) % 2 === 0) {
        const imgs = 1 + ((i + k) % 3);
        await prisma.postImage.createMany({ data: Array.from({ length: imgs }, (_, p) => ({ postId: post.id, url: pic(`post${post.id}_${p}`), position: p })) });
      }
      posts.push(post);
    }
  }

  // ---- Рілси ----
  const reels = [];
  for (const [i, name] of REELS.entries()) {
    for (const rep of [0, 1]) {
      const author = everyone[(i * 2 + rep * 5) % everyone.length];
      const post = await prisma.post.create({ data: { authorId: author.id, content: pick(REEL_CAPS, i + rep * 3), createdAt: ago(i % 6, i * 2) } });
      await prisma.postVideo.create({ data: { ownerId: author.id, postId: post.id, status: 'ready', url: name, posterUrl: null, durationSec: 10 } });
      reels.push(post);
    }
  }

  // ---- Історії (24 години) ----
  for (const [i, u] of everyone.slice(0, 14).entries()) {
    await prisma.story.create({ data: { ownerId: u.id, mediaType: 'image', mediaUrl: pic(`story${i}`, 720, 1280), caption: pick(STORY_CAPS, i), createdAt: ago(0, i % 10), expiresAt: new Date(Date.now() + (20 - i % 10) * 3600 * 1000) } });
  }

  // ---- Лайки та коментарі ----
  const allPosts = [...posts, ...reels];
  const likes = [], comments = [];
  allPosts.forEach((p, i) => {
    const likers = 2 + (i % 8);
    for (let k = 0; k < likers; k++) {
      const u = everyone[(i + k * 3) % everyone.length];
      if (u.id !== p.authorId) likes.push({ postId: p.id, userId: u.id, reaction: pick(['like', 'love', 'like', 'wow'], k) });
    }
    for (let k = 0; k < (i % 4); k++) {
      const u = everyone[(i + k * 5 + 2) % everyone.length];
      comments.push({ postId: p.id, authorId: u.id, content: pick(COMMENTS, i + k), createdAt: ago(0, (i + k) % 20) });
    }
  });
  await prisma.postLike.createMany({ data: likes, skipDuplicates: true });
  await prisma.postComment.createMany({ data: comments });
  for (const p of allPosts) {
    const [l, c] = await Promise.all([prisma.postLike.count({ where: { postId: p.id } }), prisma.postComment.count({ where: { postId: p.id } })]);
    await prisma.post.update({ where: { id: p.id }, data: { likesCount: l, commentsCount: c } });
  }

  // ---- Оголошення (схвалені) ----
  const exp = new Date(Date.now() + 30 * DAY);
  const L = (slug, owner, title, description, price, currency, city, data, imgSeed, images = 3) =>
    prisma.listing.create({
      data: {
        projectSlug: slug, ownerId: owner.id, title, description, price, currency, city, contactName: owner.firstName, data, status: 'approved', expiresAt: exp,
        images: { create: Array.from({ length: images }, (_, p) => ({ url: pic(`${imgSeed}_${p}`, 900, 650), position: p })) },
      },
    });
  const [fitness, cardio, dietitian, autosalon, agency, shop, lawyer] = biz;
  const ls = [];
  ls.push(L('real-estate', agency, '2-кімнатна квартира у Варшаві, оренда', 'Світла квартира біля метро, 48 м², меблі, інтернет. Для українців без комісії першого місяця.', 750, 'EUR', 'Варшава', { adKind: 'offer', propertyType: 'apartment', dealType: 'rent', rooms: 2, area: 48 }, 're1'));
  ls.push(L('real-estate', agency, 'Продаж будинку під Краковом', 'Будинок 120 м² з ділянкою 6 соток, тиха вулиця, гараж.', 185000, 'EUR', 'Краків', { adKind: 'offer', propertyType: 'house', dealType: 'sale', rooms: 5, area: 120 }, 're2'));
  ls.push(L('real-estate', people[5], 'Шукаю оренду 1-кімнатної у Варшаві', 'Шукаю квартиру для родини з дитиною, бюджет до 700 €, від вересня.', 700, 'EUR', 'Варшава', { adKind: 'request', propertyType: 'apartment', dealType: 'rent', rooms: 1, area: 35 }, 're3', 2));
  ls.push(L('real-estate', people[10], 'Квартира у Львові, продаж', '3-кімнатна, 78 м², свіжий ремонт, центр міста.', 95000, 'USD', 'Львів', { adKind: 'offer', propertyType: 'apartment', dealType: 'sale', rooms: 3, area: 78 }, 're4'));
  ls.push(L('cars', autosalon, 'Toyota Camry 2019, перший власник', 'Автомат, 2.5 бензин, сервісна історія, без ДТП. Автосалон, гарантія.', 21500, 'USD', 'Дніпро', { adKind: 'offer', sellerType: 'dealer', make: 'Toyota', model: 'Camry', year: 2019, mileage: 78000, fuel: 'petrol', transmission: 'automatic' }, 'car1'));
  ls.push(L('cars', autosalon, 'Volkswagen Golf 2017, дизель', 'Економічний, 1.6 TDI, мех. коробка, свіжі шини.', 12900, 'USD', 'Дніпро', { adKind: 'offer', sellerType: 'dealer', make: 'Volkswagen', model: 'Golf', year: 2017, mileage: 131000, fuel: 'diesel', transmission: 'manual' }, 'car2'));
  ls.push(L('cars', people[11], 'Продам Skoda Octavia 2015', 'Від власника, хороший стан, торг.', 9800, 'USD', 'Харків', { adKind: 'offer', sellerType: 'private', make: 'Skoda', model: 'Octavia', year: 2015, mileage: 165000, fuel: 'diesel', transmission: 'manual' }, 'car3'));
  ls.push(L('cars', people[9], 'Шукаю Renault Duster до 12 000 $', 'Шукаю кросовер, 2016+, до 150 тис. км.', 12000, 'USD', 'Київ', { adKind: 'request', make: 'Renault', model: 'Duster', year: 2016 }, 'car4', 1));
  ls.push(L('health', cardio, 'Консультація кардіолога (онлайн та у Львові)', 'Діагностика, ЕКГ, супровід пацієнтів. Консультації онлайн для українців за кордоном.', 900, 'UAH', 'Львів', { adKind: 'offer', healthKind: 'doctor', medSpecialty: 'cardiologist', experience: 14, consultFormat: 'both', workplace: 'Клініка «Здоров’я»' }, 'doc1', 2));
  ls.push(L('health', dietitian, 'Курс харчування на місяць — група 20 осіб', 'Без жорстких дієт: меню, підтримка, щотижневі розбори. Набір відкрито.', 1500, 'UAH', 'Одеса', { adKind: 'offer', healthKind: 'dietitian', experience: 9, consultFormat: 'online' }, 'diet1', 2));
  ls.push(L('health', fitness, 'Персональні тренування і групи', 'Фітнес, силові, розтяжка. Групи по 15 осіб на місяць, онлайн та офлайн.', 700, 'UAH', 'Київ', { adKind: 'offer', healthKind: 'other', experience: 8, consultFormat: 'both' }, 'fit1', 3));
  ls.push(L('shops', shop, 'Українське сало та ковбаси від фермерів', 'Натуральні продукти без добавок. Відправка по Україні та в ЄС.', null, 'UAH', 'Львів', { shopUrl: 'https://example.com/smak-ukrainy', shopCategory: 'Продукти', popularProduct: 'Сало копчене', benefits: 'Доставка в ЄС' }, 'shop1'));
  ls.push(L('jobs', agency, 'Менеджер з оренди (Варшава)', 'Шукаємо менеджера для роботи з українськими клієнтами, українська і польська.', 1300, 'EUR', 'Варшава', { jobKind: 'vacancy', employment: 'full', company: 'Домівка' }, 'job1', 1));
  ls.push(L('antiques', people[8], 'Старовинний самовар, початок XX століття', 'Мідний самовар у гарному стані, родинна реліквія.', 4500, 'UAH', 'Київ', { adKind: 'offer', era: 'початок XX ст.', condition: 'добрий' }, 'ant1'));
  ls.push(L('travel', people[0], 'Тур вихідного дня: Карпати', '3 дні, проживання, екскурсії. Збираємо групу своїх.', 3200, 'UAH', 'Київ', { adKind: 'offer', destination: 'Карпати' }, 'trip1'));
  ls.push(L('translator', lawyer, 'Переклад документів укр↔пол↔англ', 'Нотаріальний переклад і консультації щодо документів.', 300, 'UAH', 'Київ', { adKind: 'offer', languages: 'українська, польська, англійська', serviceFormat: 'online', experience: 7 }, 'tr1', 1));
  await Promise.all(ls);

  // ---- Клуби ----
  const mkClub = async (owner, name, description, category, city, joinMode, postMode, visibility, allMembers, imgSeed) => {
    const memberUsers = allMembers.filter((m) => m.id !== owner.id);
    const club = await prisma.club.create({ data: { ownerId: owner.id, name, description, category, city, joinMode, postMode, visibility, imageUrl: pic(imgSeed, 900, 500), membersCount: memberUsers.length + 1 } });
    await prisma.clubMember.create({ data: { clubId: club.id, userId: owner.id, status: 'active', canWrite: true } });
    await prisma.clubMember.createMany({ data: memberUsers.map((m, i) => ({ clubId: club.id, userId: m.id, status: 'active', canWrite: i % 3 === 0 })), skipDuplicates: true });
    return club;
  };
  const c1 = await mkClub(fitness, 'Тренування з Максимом — група на місяць', 'Закрита група на 15 осіб: програма, відео-розбори, підтримка. Вступ за заявкою.', 'sport', 'Київ', 'approval', 'owner', 'members', people.slice(0, 6), 'club1');
  const c2 = await mkClub(people[2], 'Клуб в’язання зі своїми', 'Обмінюємось візерунками, в’яжемо для ЗСУ, ділимось пряжею.', 'other', 'Харків', 'open', 'members', 'public', people.slice(3, 9), 'club2');
  const c3 = await mkClub(people[12], 'Рибалки України', 'Місця, снасті, улови. Відкрита спільнота для всіх.', 'fishing', 'Одеса', 'open', 'members', 'public', people.slice(8, 14), 'club3');
  await prisma.clubMember.createMany({ data: [{ clubId: c1.id, userId: people[8].id, status: 'pending', canWrite: false }], skipDuplicates: true });
  for (const [club, owner, txt] of [
    [c1, fitness, 'Вітаю в групі! Програма на цей тиждень: понеділок — ноги, середа — спина, п’ятниця — кардіо 💪'],
    [c1, fitness, 'Нагадую: завтра онлайн-розбір техніки о 19:00.'],
    [c2, people[2], 'Показую новий візерунок для шарфа. Хто хоче схему — пишіть! 🧶'],
    [c3, people[12], 'Вчора на Дністрі клювало чудово! Хто був — діліться уловом 🎣'],
  ]) {
    await prisma.post.create({ data: { authorId: owner.id, content: txt, clubId: club.id, createdAt: ago(1) } });
  }

  // ---- Груповий чат тренера ----
  const chat = await prisma.groupChat.create({ data: { ownerId: fitness.id, title: 'Група «Сила» — травень', lastMessageAt: new Date() } });
  const chatMembers = [fitness, ...people.slice(0, 5)];
  await prisma.groupChatMember.createMany({ data: chatMembers.map((m) => ({ groupChatId: chat.id, userId: m.id })) });
  const chatMsgs = [[fitness, 'Вітаю всіх у нашій групі! Завтра перше тренування о 19:00 🙌'], [people[0], 'Дякую! Буду.'], [people[1], 'Чи потрібен інвентар?'], [fitness, 'Достатньо килимка та пляшки води.'], [people[2], 'Супер, до завтра 💪']];
  for (const [i, [u, content]] of chatMsgs.entries()) await prisma.groupMessage.create({ data: { groupChatId: chat.id, senderId: u.id, content, createdAt: new Date(Date.now() - (chatMsgs.length - i) * 600000) } });

  // ---- Рахунки ----
  await prisma.invoice.createMany({ data: [
    { issuerId: fitness.id, payerId: people[0].id, amount: 700, currency: 'UAH', description: 'Абонемент на місяць тренувань', status: 'issued' },
    { issuerId: dietitian.id, payerId: people[3].id, amount: 1500, currency: 'UAH', description: 'Курс харчування, 1 місяць', status: 'payer_marked' },
    { issuerId: cardio.id, payerId: people[4].id, amount: 900, currency: 'UAH', description: 'Консультація кардіолога', status: 'paid', paidAt: ago(2) },
  ] });

  console.log('\nГОТОВО. Демо-дані створено:');
  console.log(`  акаунтів: ${everyone.length} (людей ${people.length}, бізнесів ${biz.length}), дописів: ${allPosts.length}, рілсів: ${reels.length}, історій: 14, оголошень: ${ls.length}, клубів: 3`);
  console.log('  Вхід: demo01@svoi.test … demo' + String(everyone.length).padStart(2, '0') + '@svoi.test, пароль Demo12345');
  console.log('  demo01 = Олена (звичайний акаунт), demo16 = «Сила» (тренер, бізнес), demo17 = кардіолог, demo19 = автосалон');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
