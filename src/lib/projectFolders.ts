/**
 * «Папки» всередині проєкту: людина заходить у проєкт і йде по папках-«кубиках» (лікарі → кардіологи, купити / орендувати тощо).
 * Кінцева папка = розділ оголошень: оголошення потрапляє в неї через поле `section`, а каталог показує лише її (фільтр f_section).
 * Папки задаються описом нижче (без нових таблиць). Назви — в messages/<мова>/listings.json → options.section.<id>
 * (стандартні папки «Інформація» й «Пропозиції та скарги» — спільні переклади projects.std.*).
 * Модуль без залежностей: безпечний і на клієнті, і на сервері.
 */
export interface ProjectFolder {
  key: string;
  icon: string;
  /** Ключ перекладу назви папки */
  labelKey: string;
  filters: Record<string, string>;
  children?: ProjectFolder[];
  /** Ідентифікатор розділу оголошень (лише кінцева папка з оголошеннями) */
  sectionId?: string;
  /** Не каталог, а заявка: кабінет, команда, новий напрям. Відкриває «Як заробити» з пресетом заявки */
  apply?: boolean;
  /** Подати оголошення в розділ може лише бізнес-акаунт */
  business?: boolean;
  /** Поля, що виставляються автоматично за розділом (наприклад dealType=sale) */
  derive?: Record<string, string>;
  /** Звичайне посилання (папка веде в інший розділ платформи) */
  href?: string;
  /** Розділ показує бізнес-кабінети (магазини), а не стрічку оголошень */
  directory?: boolean;
  /** Не каталог: спеціальний екран (форма замовлення, інформація, заявка-форма, структурна анкета fx:<id>, мої заявки mine:<види>). */
  kind?: string;
  /** Кнопки-заявки над каталогом розділу: ідентифікатори форм з projectForms (суфікс «!» — форма відкрита одразу) */
  acts?: string[];
  /** Вибір «папок» з наявних оголошень перед каталогом: поля data або city (країна → область → місто, порода) */
  drill?: string[];
}

interface Spec {
  key: string;
  icon: string;
  kids?: Spec[];
  apply?: boolean;
  business?: boolean;
  derive?: Record<string, string>;
  href?: string;
  directory?: boolean;
  kind?: string;
  acts?: string[];
  drill?: string[];
  /** Папка-посилання на іншу папку цього ж проєкту (шлях a.b) */
  to?: string;
  /** Спільний ключ перекладу назви (стандартні папки) */
  lk?: string;
}

const slugId = (slug: string) => slug.replace(/-/g, '_');

/** Ідентифікатор розділу: <slug>_<батьківська>_<дочірня>. Дефіси замінено на «_», щоб підходило для ключів перекладу. */
export function sectionIdOf(slug: string, path: string[]): string {
  return [slugId(slug)].concat(path).join('_');
}

/** Посилання на папку проєкту (внутрішнє): ?folder=a.b */
export const folderLink = (slug: string, path: string) => `/projects/${slug}?folder=${path}`;

function build(slug: string, specs: Spec[], parents: string[]): ProjectFolder[] {
  return specs.map((s) => {
    const path = parents.concat(s.key);
    const id = sectionIdOf(slug, path);
    const node: ProjectFolder = { key: s.key, icon: s.icon, labelKey: s.lk || `listings.options.section.${id}`, filters: {} };
    if (s.kids) {
      node.children = build(slug, s.kids, path);
    } else if (s.to) {
      node.href = folderLink(slug, s.to);
    } else if (s.href) {
      node.href = s.href;
    } else if (s.apply) {
      node.apply = true;
    } else if (s.kind) {
      node.kind = s.kind;
    } else {
      node.sectionId = id;
      node.filters = { f_section: id };
      if (s.business) node.business = true;
      if (s.directory) node.directory = true;
      if (s.derive) node.derive = s.derive;
      if (s.acts) node.acts = s.acts;
      if (s.drill) node.drill = s.drill;
    }
    return node;
  });
}

const leaf = (key: string, icon: string, extra?: Partial<Spec>): Spec => ({ key, icon, ...extra });
const apply = (key: string, icon = '➕'): Spec => ({ key, icon, apply: true });
const view = (key: string, icon: string, kind: string): Spec => ({ key, icon, kind });
/** Структурна анкета (projectForms) */
const fx = (key: string, icon: string, form: string, lk?: string): Spec => ({ key, icon, kind: `fx:${form}`, ...(lk ? { lk } : {}) });
/** Посилання на інший проєкт платформи */
const proj = (key: string, icon: string, slug: string): Spec => ({ key, icon, href: `/projects/${slug}` });

// ——— Стандартні папки, однакові в усіх проєктах за ТЗ замовника ———
const std = (key: string, icon: string, kind = 'info'): Spec => ({ key, icon, kind, lk: `projects.std.${key}` });
const stdFx = (key: string, icon: string, form: string): Spec => ({ key, icon, kind: `fx:${form}`, lk: `projects.std.${key}` });
/** «Інформація про проєкт. Заробляй зі своїми» */
const INFO = (kids: Spec[]): Spec => ({ key: 'info', icon: 'ℹ️', lk: 'projects.std.info', kids });
/** «Пропозиції та скарги» */
const FEEDBACK = (kids: Spec[]): Spec => ({ key: 'feedback', icon: '💬', lk: 'projects.std.feedback', kids });
const S_ABOUT = std('about', '🏠');
const S_HOW = std('how', '⚙️');
const S_EARN = std('earn', '💼');
const S_REP = std('rep', '🌍', 'repapply:open');
const S_TEAM = std('team', '👥', 'repapply:open');
const S_PARTNER = stdFx('partner', '🤝', 'partnerApply');
const S_NEWS = std('news', '📰');
const S_INVITE: Spec = { key: 'invite', icon: '📨', href: '/menu/qr', lk: 'projects.std.invite' };
/** Звернення: пропозиція / скарга (з фото) / питання */
const fb = (key: string, icon: string, kind: 'suggestion' | 'complaint', lk?: string): Spec => ({ key, icon, kind: `forma:${kind}`, ...(lk ? { lk } : {}) });
const F_SUGGEST = fb('suggest', '💡', 'suggestion', 'projects.std.suggest');
const F_REVIEW = fb('review', '⭐', 'suggestion', 'projects.std.review');
const F_COMPLAINT = fb('complaint', '📣', 'complaint', 'projects.std.complaint');
const F_DIRECTION = fb('direction', '🚀', 'suggestion', 'projects.std.direction');
const F_SUPPORT: Spec = { key: 'support', icon: '🛟', kind: 'form:consult', lk: 'projects.std.support' };

/** Типові кнопки каталогу спеціалістів: заявка + приєднання до команди */
const SPEC = (key: string, icon: string, acts: string[] = ['consult', 'join'], extra?: Partial<Spec>): Spec => leaf(key, icon, { business: true, acts, ...extra });

// ——— «Клуби за інтересами»: однакова структура кожного клубу (країни, дошка, магазин, блогери, курси, події, спеціалісти, команда) ———
const CLUB_LIST: Array<[string, string]> = [['hunting', '🦌'], ['fishing', '🎣'], ['pets', '🐾'], ['auto', '🚗'], ['moto', '🏍️'], ['bike', '🚴'], ['knitting', '🧶'], ['cooking', '🍳'], ['pastry', '🎂']];
const CLUB_SHOP_CATS: Array<[string, string]> = [['hunters', '🦌'], ['fishers', '🎣'], ['pets', '🐾'], ['auto', '🚗'], ['moto', '🏍️'], ['bike', '🚴'], ['knitting', '🧶'], ['cooking', '🍳'], ['pastry', '🎂'], ['other', '🛍️']];
const GEO = ['country', 'region', 'city'];
const clubNode = (c: string, icon: string): Spec => ({
  key: c, icon, kids: [
    { key: 'communities', icon: '🌍', lk: 'projects.std.cl_communities', kids: [
      { key: 'list', icon: '👥', href: `/clubs?category=${c}`, lk: 'projects.std.cl_list' },
      { key: 'join', icon: '🤝', kind: 'fx:joinClub', lk: 'projects.std.cl_join' },
      { key: 'lead', icon: '🏛️', kind: 'repapply:open', lk: 'projects.std.cl_lead' },
    ] },
    leaf('board', '📋', { lk: 'projects.std.cl_board', drill: GEO }),
    leaf('shop', '🛒', { lk: 'projects.std.cl_shop', business: true, acts: ['shopApply'] }),
    leaf('bloggers', '🎥', { lk: 'projects.std.cl_bloggers', acts: ['becomeBlogger'] }),
    { key: 'courses', icon: '🎓', lk: 'projects.std.cl_courses', kids: [
      leaf('amateur', '📚', { lk: 'projects.std.cl_amateur', acts: ['offerCourse'] }),
      leaf('certified', '📜', { lk: 'projects.std.cl_certified', acts: ['offerCourse'] }),
    ] },
    leaf('events', '📅', { lk: 'projects.std.cl_events', drill: GEO }),
    SPEC('experts', '🧑‍🏫', ['consult', 'join'], { lk: 'projects.std.cl_experts', drill: GEO }),
    { key: 'team', icon: '👥', kind: 'repapply:open', lk: 'projects.std.cl_team' },
  ],
});

// ——— «Антикварна лавка»: онлайн-/офлайн-крамниці та експерти ———
const ANT_CATS: Array<[string, string]> = [['coins', '🪙'], ['antique', '🏺'], ['jewelry', '💎'], ['porcelain', '🍶'], ['watches', '⌚'], ['furniture', '🪑'], ['books', '📜'], ['collectibles', '🏆'], ['other', '✨']];
const ANT_ART = ['paintings', 'icons', 'sculptures', 'graphics', 'engravings', 'objects', 'otherArt'];
const ANT_ACTS = ['appraisalRequest', 'shopApply', 'newDirection'];
const antLeaf = (key: string, icon: string): Spec => leaf(key, icon, { acts: ANT_ACTS });
const antPeople = (acts: string[], keys: string[], extraKey: string): Spec[] => keys.map((k) => SPEC(k, '🧑‍🔬', acts, { drill: GEO })).concat([fx(extraKey, '➕', 'newDirection')]);

// ——— «Український експортний альянс»: аграрії, постачальники, ринки збуту ———
const EXP_AGRO: Array<[string, string, string[]]> = [
  ['plants', '🌾', ['grain', 'oilseeds', 'legumes', 'technical', 'fodder']], ['berries', '🍓', ['strawberry', 'raspberry', 'blueberry', 'blackberry', 'currant', 'otherBerries']],
  ['vegetables', '🥔', ['potato', 'tomato', 'cucumber', 'cabbage', 'carrotBeet', 'onion', 'garlic', 'melons', 'otherVeg']], ['orchards', '🍎', ['apple', 'pear', 'cherry', 'plumApricot', 'nuts', 'otherFruit']],
  ['vineyards', '🍇', ['tableGrape', 'technicalGrape', 'nurseries']], ['livestock', '🐄', ['cattle', 'pigs', 'sheep', 'goats', 'horses', 'otherLivestock']],
  ['poultry', '🐔', ['chicken', 'turkey', 'duckGoose', 'quail', 'otherPoultry']], ['fish', '🐟', ['fishBreeding', 'ponds', 'crayfish', 'shrimp', 'otherAqua']],
  ['forestry', '🌲', ['forestry', 'saplings', 'forestNurseries', 'timber', 'reforestation']], ['greenhouses', '🏡', ['vegGreenhouse', 'berryGreenhouse', 'flowerGreenhouse', 'nurseries', 'hydroponics']],
  ['land', '🗺️', ['landowners', 'lessors', 'tenants', 'farms', 'agroCompanies', 'landCoops']], ['otherAgro', '🌱', ['bees', 'flowers', 'decorative', 'mushrooms', 'herbs', 'seeds']],
];
const EXP_SUPPLY: Array<[string, string, string[]]> = [
  ['fertilizers', '🧪', ['mineral', 'organic', 'complex', 'npk', 'micro', 'liquid', 'stimulants']], ['seeds', '🌱', []], ['protection', '🛡️', []], ['machinery', '🚜', []],
  ['fuel', '⛽', []], ['storage', '🏭', []], ['irrigation', '💧', []], ['packaging', '📦', []],
];
const EXP_BUYERS = ['vegBases', 'wholesale', 'chains', 'processing', 'meat', 'dairy', 'canning', 'freezing', 'foodProd', 'horeca', 'distributors', 'wholeBuyers'];
const EXP_COMPANIES = ['processing', 'vegBases', 'chains', 'meatDairy', 'canningFreezing', 'foodProd', 'distributors', 'importers', 'otherBuyers'];
const EXP_INTL = ['regions', 'importers', 'wholeBuyers', 'processing', 'chains', 'distributors', 'allianceReps', 'logisticsPartners'];
const EXP_LOGISTICS = ['refrigerated', 'grain', 'special', 'groupage', 'international', 'rail', 'road', 'otherLogistics'];
const EXP_ACTS = ['farmApply', 'marketRequest', 'newDirection'];
const expGroup = (key: string, icon: string, subs: string[], acts: string[], extra?: Partial<Spec>): Spec => ({ key, icon, kids: subs.map((k) => leaf(k, icon, { business: true, drill: GEO, acts, ...extra })).concat([fx('newDirection', '➕', 'newDirection')]) });

/** Специфікація папок за ТЗ замовника (скріншоти, голосові та файли структури). Порядок = порядок на екрані. */
const SPECS: Record<string, Spec[]> = {
  // «Юристи»: 7 кнопок за ТЗ. 1 — дерево представництв (країна → область → район → громада), 2–4 — заявки з маршрутом до керівника,
  // 5 і 7 — «Інформація» та «Пропозиції й скарги» (SuggestBox), 6 — допомога. Оголошення адвокатів лишаються окремою папкою.
  lawyers: [
    view('network', '⚖️', 'reptree'),
    view('cabinet', '🗂️', 'repapply:lawyer'),
    { key: 'team', icon: '👥', kids: [view('join', '🤝', 'repapply:join'), view('open', '🏛️', 'repapply:open')] },
    view('consult', '💬', 'repapply:consult'),
    view('help', '🛟', 'form:request'),
    leaf('advocates', '📋', { business: true }),
  ],
  // «Нерухомість» за ТЗ замовника: 5 кнопок (купити, оренда, усе для дому, інформація, пропозиції та скарги). Назву проєкту ця структура не змінює.
  'real-estate': [
    { key: 'sale', icon: '🏠', kids: [
      leaf('apartments', '🏢', { derive: { dealType: 'sale', propertyType: 'apartment' } }),
      leaf('houses', '🏡', { derive: { dealType: 'sale', propertyType: 'house' } }),
      leaf('land', '🌳', { derive: { dealType: 'sale', propertyType: 'land' } }),
      leaf('commercial', '🏬', { derive: { dealType: 'sale', propertyType: 'commercial' } }),
      leaf('garages', '🚗', { derive: { dealType: 'sale', propertyType: 'garage' } }),
      leaf('newbuilds', '🏗️', { derive: { dealType: 'sale', propertyType: 'newbuild' } }),
    ] },
    { key: 'rent', icon: '🔑', kids: [
      leaf('apartments', '🏢', { derive: { dealType: 'rent', propertyType: 'apartment' } }),
      leaf('houses', '🏡', { derive: { dealType: 'rent', propertyType: 'house' } }),
      leaf('rooms', '🛏️', { derive: { dealType: 'rent', propertyType: 'room' } }),
      leaf('commercial', '🏬', { derive: { dealType: 'rent', propertyType: 'commercial' } }),
      leaf('offices', '💼', { derive: { dealType: 'rent', propertyType: 'office' } }),
      leaf('garages', '🚗', { derive: { dealType: 'rent', propertyType: 'garage' } }),
      leaf('short', '🗓️', { derive: { dealType: 'rent', rentTerm: 'short' } }),
    ] },
    { key: 'home', icon: '🛋️', kids: [leaf('sell', '💰'), leaf('free', '🎁'), leaf('moving', '🚚')] },
    { key: 'info', icon: 'ℹ️', kids: [view('about', '🏠', 'info'), view('how', '⚙️', 'info'), apply('earn', '💼'), apply('rep', '🌍'), view('partner', '🤝', 'formp:request'), view('invite', '📨', 'formp:request'), view('news', '📰', 'info')] },
    { key: 'feedback', icon: '💬', kids: [view('suggest', '💡', 'forma:suggestion'), view('complaint', '📣', 'forma:complaint'), view('dishonest', '🚫', 'forma:complaint'), view('performer', '🧰', 'forma:complaint'), view('review', '⭐', 'forma:suggestion'), view('direction', '🚀', 'forma:suggestion')] },
  ],

  // «Робота для своїх»: 4 кнопки. Країни й області — справжні папки (лише ті, де є вакансії / заявки), місто, професія, зарплата — фільтри.
  jobs: [
    leaf('vacancies', '💼', { derive: { jobKind: 'vacancy' }, drill: ['country', 'region'] }),
    { key: 'apply', icon: '📝', kids: [
      fx('request', '📝', 'jobSeeker'),
      leaf('candidates', '🔎', { derive: { jobKind: 'resume' }, drill: ['country', 'region'] }),
      view('mine', '🗂️', 'mine:request'),
    ] },
    INFO([S_ABOUT, S_HOW, S_EARN, S_REP, S_TEAM, S_PARTNER, { key: 'inviteEmployer', icon: '🏢', href: '/menu/qr', lk: 'projects.std.inviteEmployer' }, S_NEWS]),
    FEEDBACK([F_SUGGEST, fb('complaintVacancy', '📣', 'complaint'), fb('dishonest', '🚫', 'complaint'), fb('problem', '⚠️', 'complaint'), F_REVIEW, F_DIRECTION]),
  ],

  // «Автосалон онлайн»: купити авто, оренда, інтернет-магазини (8 категорій), інформація, пропозиції та скарги
  cars: [
    leaf('buy', '🚗', { drill: ['country', 'region'], acts: ['carPick'] }),
    leaf('rent', '🔑', { drill: ['country', 'region'], acts: ['carRentRequest'] }),
    { key: 'shops', icon: '🛒', kids: [
      leaf('newParts', '⚙️', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('usedParts', '🔩', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('accessories', '🧰', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('tires', '🛞', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('care', '🧴', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('electronics', '📹', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('tools', '🔧', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('other', '📦', { business: true, directory: true, acts: ['shopApply'] }),
    ] },
    INFO([S_ABOUT, S_HOW, S_EARN, S_REP, S_TEAM, S_PARTNER, S_NEWS]),
    FEEDBACK([F_SUGGEST, fb('complaintAd', '📣', 'complaint'), fb('complaintRent', '🔑', 'complaint'), fb('dishonest', '🚫', 'complaint'), fb('complaintShop', '🛒', 'complaint'), fb('orderProblem', '📦', 'complaint'), F_REVIEW, F_DIRECTION]),
  ],

  // «Крамниця для своїх»: 10 кнопок за ТЗ (7 товарних/сервісних напрямів, інформація, пропозиції та скарги, додати свій розділ)
  shops: [
    { key: 'food', icon: '🥩', kids: [leaf('meat', '🥩', { business: true }), leaf('fish', '🐟', { business: true }), leaf('dairy', '🥛', { business: true }), leaf('vegetables', '🥕', { business: true }), leaf('grocery', '🌾', { business: true }), leaf('bakery', '🥖', { business: true }), leaf('sweets', '🍬', { business: true }), leaf('preserves', '🫙', { business: true }), leaf('drinks', '🥤', { business: true }), fx('addDept', '➕', 'addDept', 'projects.std.addDept')] },
    { key: 'clothes', icon: '👗', kids: [leaf('women', '👗', { business: true }), leaf('men', '👔', { business: true }), leaf('kids', '🧒', { business: true }), leaf('sport', '🏃', { business: true }), leaf('jeans', '👖', { business: true }), leaf('outer', '🧥', { business: true }), leaf('tshirts', '👕', { business: true }), leaf('dresses', '👚', { business: true }), leaf('underwear', '🩲', { business: true }), leaf('shoes', '👟', { business: true }), leaf('bags', '👜', { business: true }), fx('addDept', '➕', 'addDept', 'projects.std.addDept')] },
    { key: 'chemistry', icon: '🧴', kids: [leaf('laundry', '🧺', { business: true }), leaf('dishes', '🍽️', { business: true }), leaf('cleaning', '🧽', { business: true }), leaf('bathroom', '🚿', { business: true }), leaf('soap', '🧼', { business: true }), leaf('shampoo', '🧴', { business: true }), leaf('deodorants', '🌸', { business: true }), leaf('cosmetics', '💄', { business: true }), leaf('paper', '🧻', { business: true }), leaf('home', '🏠', { business: true }), fx('addDept', '➕', 'addDept', 'projects.std.addDept')] },
    { key: 'souvenirs', icon: '🎁', kids: [leaf('symbols', '🇺🇦', { business: true }), leaf('themed', '🎎', { business: true }), leaf('embroidery', '👘', { business: true }), leaf('handmade', '🧵', { business: true }), leaf('ceramics', '🏺', { business: true }), leaf('giftsets', '🎀', { business: true }), leaf('magnets', '🧲', { business: true }), leaf('jewelry', '💍', { business: true }), leaf('decor', '🕯️', { business: true }), fx('addDept', '➕', 'addDept', 'projects.std.addDept')] },
    { key: 'electro', icon: '🔌', kids: [leaf('appliances', '🔌', { business: true }), leaf('kitchen', '🍳', { business: true }), leaf('tv', '📺', { business: true }), leaf('phones', '📱', { business: true }), leaf('computers', '💻', { business: true }), leaf('lighting', '💡', { business: true }), leaf('cables', '🔗', { business: true }), leaf('sockets', '🔘', { business: true }), leaf('powertools', '🔧', { business: true }), leaf('batteries', '🔋', { business: true }), leaf('repair', '🛠️', { business: true }), fx('addDept', '➕', 'addDept', 'projects.std.addDept')] },
    { key: 'delivery', icon: '🚚', kids: [leaf('fromUa', '🚚', { business: true, acts: ['carrierAdd'] }), leaf('europe', '🚛', { business: true, acts: ['carrierAdd'] }), leaf('request', '📮')] },
    { key: 'abroad', icon: '🌍', kids: [
      leaf('stores', '🏪', { business: true, drill: ['country', 'region', 'city'], acts: ['partnerStore'] }),
      leaf('warehouses', '🏭', { business: true, drill: ['country', 'region', 'city'], acts: ['partnerStore'] }),
    ] },
    INFO([S_ABOUT, S_HOW, S_EARN, S_REP, S_TEAM, S_PARTNER, S_NEWS]),
    FEEDBACK([fb('suggest', '💡', 'suggestion', 'projects.std.suggest'), fb('complaintShop', '🛒', 'complaint'), fb('complaintGoods', '📦', 'complaint'), fb('delivery', '🚚', 'complaint'), fb('complaintCarrier', '🏭', 'complaint'), F_REVIEW, F_DIRECTION]),
    fx('addSection', '➕', 'addSection'),
  ],

  // «Здоров'я для своїх»: 9 кнопок. Онлайн-консультації, а де потрібна присутність — вибір країни й міста лише з наявних фахівців.
  health: [
    { key: 'doctors', icon: '🩺', kids: [SPEC('family', '👨‍⚕️'), SPEC('therapist', '🧑‍⚕️'), SPEC('pediatrician', '👶'), SPEC('dermatologist', '🧴'), SPEC('allergist', '🤧'), SPEC('other', '🏥'), fx('newDirection', '➕', 'newDirection', 'projects.std.newDirection')] },
    { key: 'nutrition', icon: '🥗', kids: [SPEC('dietitian', '🥗'), SPEC('sportNutrition', '💪'), SPEC('healthyEating', '🍎'), SPEC('childNutrition', '🍼'), fx('newDirection', '➕', 'newDirection', 'projects.std.newDirection')] },
    { key: 'sport', icon: '🏋️', kids: [SPEC('personal', '🎯', ['training', 'join']), SPEC('fitness', '🏋️', ['training', 'join']), SPEC('yoga', '🧘', ['training', 'join']), SPEC('other', '🤸', ['training', 'join']), fx('newDirection', '➕', 'newDirection', 'projects.std.newDirection')] },
    { key: 'psychology', icon: '🧠', kids: [SPEC('psychologists', '🧠'), SPEC('psychotherapists', '🛋️'), SPEC('family', '👪'), SPEC('child', '🧸'), SPEC('teen', '🧑‍🎓'), SPEC('sexologists', '❤️'), SPEC('addiction', '🆘'), SPEC('sleep', '😴'), SPEC('stress', '🌿'), fx('newDirection', '➕', 'newDirection', 'projects.std.newDirection')] },
    { key: 'recovery', icon: '🦽', kids: [SPEC('masseurs', '💆', ['service', 'join'], { drill: ['country', 'city'] }), SPEC('injury', '🩹', ['service', 'join'], { drill: ['country', 'city'] }), SPEC('speech', '🗣️', ['consult', 'join']), fx('newDirection', '➕', 'newDirection', 'projects.std.newDirection')] },
    { key: 'motherChild', icon: '🤰', kids: [SPEC('lactation', '🍼'), SPEC('birthPrep', '🤰'), SPEC('childMassage', '👶', ['service', 'join'], { drill: ['country', 'city'] }), SPEC('childRehab', '🧒', ['service', 'join'], { drill: ['country', 'city'] }), SPEC('childSpeech', '🗣️'), fx('newDirection', '➕', 'newDirection', 'projects.std.newDirection')] },
    { key: 'shops', icon: '🛍️', kids: [
      leaf('sportFood', '💪', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('healthyFood', '🍎', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('sportGoods', '🏋️', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('goods', '🩹', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('mothers', '🍼', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('care', '🧼', { business: true, directory: true, acts: ['shopApply'] }),
      fx('newCategory', '➕', 'newDirection', 'projects.std.newCategory'),
    ] },
    INFO([S_ABOUT, S_HOW, S_EARN, std('becomeSpecialist', '🩺', 'fx:becomeSpecialist'), S_TEAM, S_PARTNER, S_NEWS]),
    FEEDBACK([F_SUGGEST, F_REVIEW, F_COMPLAINT, fb('specialist', '🧑‍⚕️', 'suggestion'), F_SUPPORT]),
  ],

  // «Помічник на годину»: 5 кнопок (майстри, заявка й кабінет, оренда й виконання робіт, інформація, пропозиції та скарги)
  'helper-hour': [
    { key: 'masters', icon: '🧑‍🔧', kids: [
      leaf('construction', '🧱', { acts: ['orderWork'] }), leaf('plumbing', '🚰', { acts: ['orderWork'] }), leaf('electric', '⚡', { acts: ['orderWork'] }),
      leaf('furniture', '🪑', { acts: ['orderWork'] }), leaf('garden', '🌿', { acts: ['orderWork'] }), leaf('firewood', '🪵', { acts: ['orderWork'] }),
      leaf('cleaning', '🧹', { acts: ['orderWork'] }), leaf('transport', '🚚', { acts: ['orderWork'] }), leaf('misc', '🛠️', { acts: ['orderWork'] }),
    ] },
    { key: 'cabinet', icon: '🗂️', kids: [
      fx('apply', '📝', 'masterApply'),
      view('create', '🛠️', 'info'),
      { key: 'my', icon: '🧰', kids: [
        { key: 'profile', icon: '👤', href: '/profile' }, { key: 'services', icon: '🧾', href: '/my-listings' },
        { key: 'orders', icon: '🆕', to: 'work.job.need' }, { key: 'replies', icon: '💬', href: '/chat' },
        { key: 'active', icon: '⏳', href: '/my-listings' }, { key: 'messages', icon: '✉️', href: '/chat' },
        { key: 'reviews', icon: '⭐', href: '/reviews' }, { key: 'settings', icon: '⚙️', href: '/menu/settings' },
      ] },
      { key: 'team', icon: '👥', kids: [view('network', '🌍', 'reptree'), view('create', '🏙️', 'repapply:open'), view('join', '🤝', 'repapply:open'), { key: 'invite', icon: '📨', href: '/menu/qr' }] },
    ] },
    { key: 'work', icon: '🧰', kids: [
      { key: 'rent', icon: '🔧', kids: [
        leaf('powerTools', '🔧', { acts: ['rentRequest'] }), leaf('garden', '🌱', { acts: ['rentRequest'] }), leaf('washers', '🚿', { acts: ['rentRequest'] }), leaf('building', '🏗️', { acts: ['rentRequest'] }),
        leaf('trailers', '🚛', { acts: ['rentRequest'] }), leaf('generators', '🔋', { acts: ['rentRequest'] }), leaf('repair', '🪛', { acts: ['rentRequest'] }), leaf('other', '📦', { acts: ['rentRequest'] }),
      ] },
      { key: 'job', icon: '💪', kids: [leaf('find', '🔎'), leaf('need', '📝', { acts: ['offerWork'] })] },
    ] },
    INFO([S_ABOUT, S_HOW, S_EARN, S_REP, S_TEAM, S_PARTNER, S_INVITE, S_NEWS]),
    FEEDBACK([F_SUGGEST, fb('complaintMaster', '📣', 'complaint'), fb('rentProblem', '🧰', 'complaint'), fb('dishonest', '🚫', 'complaint'), F_REVIEW, F_DIRECTION]),
  ],

  // «Перекладач»: 4 кнопки (перекладачі за мовами, переклад документів і текстів, інформація, пропозиції та скарги)
  translator: [
    { key: 'translators', icon: '🌐', kids: [
      leaf('english', '🇬🇧', { acts: ['translateRequest', 'join'] }), leaf('german', '🇩🇪', { acts: ['translateRequest', 'join'] }), leaf('czech', '🇨🇿', { acts: ['translateRequest', 'join'] }),
      leaf('polish', '🇵🇱', { acts: ['translateRequest', 'join'] }), leaf('romanian', '🇷🇴', { acts: ['translateRequest', 'join'] }), leaf('hungarian', '🇭🇺', { acts: ['translateRequest', 'join'] }),
      leaf('french', '🇫🇷', { acts: ['translateRequest', 'join'] }), leaf('spanish', '🇪🇸', { acts: ['translateRequest', 'join'] }), leaf('italian', '🇮🇹', { acts: ['translateRequest', 'join'] }),
      leaf('ukrainian', '🇺🇦', { acts: ['translateRequest', 'join'] }), leaf('slovak', '🇸🇰', { acts: ['translateRequest', 'join'] }), leaf('other', '🌍', { acts: ['translateRequest', 'join'] }),
      fx('newLanguage', '➕', 'newLanguage'), fx('newDirection', '🧭', 'newDirection', 'projects.std.newDirection'), fx('becomeTranslator', '🖋️', 'becomeTranslator', 'projects.std.becomeTranslator'),
    ] },
    { key: 'documents', icon: '📄', kids: [fx('official', '📜', 'translateOfficial'), fx('ordinary', '📄', 'translateDocs'), fx('texts', '📝', 'translateText'), fx('newDirection', '➕', 'newDirection', 'projects.std.newDirection')] },
    INFO([S_ABOUT, S_HOW, S_EARN, stdFx('becomeTranslator', '🖋️', 'becomeTranslator'), S_TEAM, S_PARTNER, std('ownTeam', '🏗️', 'repapply:open'), S_NEWS]),
    FEEDBACK([F_SUGGEST, fb('newLanguage', '🌐', 'suggestion'), fb('newDirection', '🧭', 'suggestion'), F_REVIEW, F_COMPLAINT, F_SUPPORT]),
  ],

  // «Business Speed — ключ для своїх» (бізнес під ключ): 5 розділів за ТЗ
  turnkey: [
    { key: 'specialists', icon: '🧑‍💼', kids: [SPEC('accounting', '🧮', ['serviceRequest', 'becomeSpecialist']), SPEC('legal', '⚖️', ['serviceRequest', 'becomeSpecialist']), SPEC('it', '💻', ['serviceRequest', 'becomeSpecialist']), SPEC('sales', '📈', ['serviceRequest', 'becomeSpecialist']), SPEC('hr', '🤝', ['serviceRequest', 'becomeSpecialist']), SPEC('logistics', '🚚', ['serviceRequest', 'becomeSpecialist']), SPEC('admin', '🗂️', ['serviceRequest', 'becomeSpecialist']), fx('addService', '➕', 'newDirection', 'projects.std.newDirection')] },
    leaf('partners', '🤝', { drill: ['country'], acts: ['partnerSearch', 'marketSearch'] }),
    { key: 'projects', icon: '🧩', kids: [proj('jobs', '💼', 'jobs'), proj('export', '🚢', 'export-alliance'), proj('china', '📦', 'china'), proj('shops', '🛍️', 'shops'), { key: 'others', icon: '🧩', href: '/projects' }, fx('help', '🆘', 'bizHelp')] },
    INFO([S_ABOUT, S_HOW, S_EARN, S_REP, S_TEAM, S_PARTNER, S_NEWS]),
    FEEDBACK([F_SUGGEST, F_REVIEW, F_COMPLAINT, fb('partnership', '🤝', 'suggestion'), F_SUPPORT]),
  ],

  china: [
    { key: 'search', icon: '🔎', kids: [leaf('product', '📦'), leaf('manufacturer', '🏭'), leaf('analogs', '🔁'), leaf('compare', '⚖️'), leaf('suppliers', '🏢'), leaf('custom', '📝')] },
    { key: 'brand', icon: '🏷️', kids: [leaf('create', '🎯'), leaf('design', '🎨'), leaf('packaging', '📦'), leaf('production', '🏭'), leaf('custom', '📐'), leaf('newProduct', '💡'), leaf('samples', '🧪')] },
    { key: 'rep', icon: '🤝', kids: [leaf('agent', '🧑‍💼'), leaf('negotiations', '💬'), leaf('visit', '🚶'), leaf('translator', '🗣️'), leaf('partners', '🔗'), leaf('deals', '📑')] },
    { key: 'quality', icon: '✅', kids: [leaf('manufacturerCheck', '🔍'), leaf('samples', '🧪'), leaf('productionControl', '🏗️'), leaf('finalCheck', '📋'), leaf('media', '📸'), leaf('packagingCheck', '🎁')] },
    { key: 'finance', icon: '💴', kids: [leaf('rate', '📈'), leaf('exchange', '💱'), leaf('payment', '🧾'), leaf('international', '🌐'), leaf('totalCost', '🧮'), leaf('support', '🛡️')] },
    { key: 'logistics', icon: '🚢', kids: [leaf('air', '✈️', { business: true }), leaf('rail', '🚆', { business: true }), leaf('sea', '🚢', { business: true }), leaf('road', '🚚', { business: true }), leaf('express', '⚡', { business: true }), leaf('groupage', '📦', { business: true }), leaf('quote', '🧮')] },
    { key: 'warehouse', icon: '🏬', kids: [leaf('warehouse', '🏬'), leaf('consolidation', '🔗'), leaf('repack', '📦'), leaf('inspection', '⚖️'), leaf('customs', '🛃'), leaf('docs', '📄'), leaf('certification', '📜')] },
    { key: 'wholesale', icon: '🛒', kids: [leaf('shops', '🏪'), leaf('online', '💻'), leaf('marketplaces', '🛍️'), leaf('regular', '🔄'), leaf('business', '🎯'), leaf('custom', '📝')] },
    { key: 'trips', icon: '✈️', kids: [leaf('expos', '🎪'), leaf('organize', '🗺️'), leaf('factories', '🏭'), leaf('partners', '🤝'), leaf('translator', '🗣️'), leaf('tours', '🧳')] },
    { key: 'consult', icon: '💬', kids: [leaf('start', '🌱'), leaf('working', '💼'), leaf('purchaseHelp', '🆘'), leaf('turnkeyCalc', '🧮'), leaf('custom', '❓'), leaf('partner', '🤝')] },
  ],

  // «Інвестиційні проєкти та пошук інвесторів»: 5 розділів за ТЗ
  invest: [
    leaf('projects', '📈', { derive: { investKind: 'project' }, acts: ['investApply', 'projectContact'] }),
    leaf('investors', '💰', { derive: { investKind: 'investor' }, acts: ['investApply'] }),
    { key: 'specialists', icon: '🧑‍💼', kids: [
      SPEC('analyst', '📊', ['serviceRequest', 'join']), SPEC('financial', '💹', ['serviceRequest', 'join']), SPEC('economist', '🧮', ['serviceRequest', 'join']),
      SPEC('auditor', '🔍', ['serviceRequest', 'join']), SPEC('marketer', '📣', ['serviceRequest', 'join']), SPEC('risk', '🛡️', ['serviceRequest', 'join']),
      SPEC('valuation', '🏷️', ['serviceRequest', 'join']), SPEC('lawyers', '⚖️', ['serviceRequest', 'join']), SPEC('pm', '🗓️', ['serviceRequest', 'join']),
      SPEC('consultants', '💼', ['serviceRequest', 'join']), SPEC('other', '🧭', ['serviceRequest', 'join']),
      fx('newSpecialty', '➕', 'newDirection'), fx('becomeSpecialist', '🧑‍💼', 'becomeSpecialist', 'projects.std.becomeSpecialist'),
    ] },
    INFO([S_ABOUT, S_HOW, S_EARN, std('howPlace', '📈'), std('howInvestor', '💰'), std('howSpecialist', '🧑‍💼'), S_PARTNER, std('ownTeam', '🏗️', 'repapply:open'), S_NEWS]),
    FEEDBACK([F_SUGGEST, fb('newCategory', '📂', 'suggestion'), fb('newSpecialty', '🧑‍💼', 'suggestion'), F_REVIEW, fb('complaintProject', '📣', 'complaint'), fb('complaintUser', '🚫', 'complaint'), F_SUPPORT]),
  ],

  // «Турагентство»: 8 розділів за ТЗ
  travel: [
    leaf('turnkey', '🧳', { business: true, acts: ['tourRequest', 'consult', 'join'] }),
    leaf('join', '👥', { acts: ['seatRequest', 'askOrganizer', 'join'] }),
    leaf('pick', '🏖️', { acts: ['pickRest!', 'mine', 'consult', 'join'] }),
    { key: 'hot', icon: '🔥', kids: [
      leaf('cancelled', '↩️', { business: true, acts: ['bookTour', 'checkSeats', 'consult', 'join'] }), leaf('prepaid', '🎟️', { business: true, acts: ['bookTour', 'checkSeats', 'consult', 'join'] }),
      leaf('urgent', '⏱️', { business: true, acts: ['bookTour', 'checkSeats', 'consult', 'join'] }), leaf('promo', '🏷️', { business: true, acts: ['bookTour', 'checkSeats', 'consult', 'join'] }),
      leaf('lastSeats', '💺', { business: true, acts: ['bookTour', 'checkSeats', 'consult', 'join'] }),
    ] },
    { key: 'tickets', icon: '🎫', kids: [
      leaf('avia', '✈️', { business: true, acts: ['ticketRequest', 'mine', 'join'] }), leaf('rail', '🚆', { business: true, acts: ['ticketRequest', 'mine', 'join'] }),
      leaf('bus', '🚌', { business: true, acts: ['ticketRequest', 'mine', 'join'] }), leaf('other', '🚢', { business: true, acts: ['ticketRequest', 'mine', 'join'] }),
    ] },
    { key: 'insurance', icon: '🛡️', kids: [
      leaf('medical', '🏥', { business: true, acts: ['insuranceRequest', 'consult', 'join'] }), leaf('abroad', '🌍', { business: true, acts: ['insuranceRequest', 'consult', 'join'] }),
      leaf('family', '👪', { business: true, acts: ['insuranceRequest', 'consult', 'join'] }), leaf('child', '🧒', { business: true, acts: ['insuranceRequest', 'consult', 'join'] }),
      leaf('active', '🏔️', { business: true, acts: ['insuranceRequest', 'consult', 'join'] }), leaf('accident', '🩹', { business: true, acts: ['insuranceRequest', 'consult', 'join'] }),
      leaf('other', '📄', { business: true, acts: ['insuranceRequest', 'consult', 'join'] }),
    ] },
    INFO([S_ABOUT, S_HOW, S_EARN, std('becomeAgent', '🧑‍✈️', 'fx:becomeAgent'), S_TEAM, std('organizer', '🚌', 'fx:becomeOrganizer'), std('partnerHotels', '🏨', 'fx:partnerApply'), std('partnerInsurance', '🛡️', 'fx:partnerApply'), S_NEWS]),
    FEEDBACK([F_SUGGEST, fb('newDestination', '🗺️', 'suggestion'), fb('newService', '🧩', 'suggestion'), fb('tripReview', '⭐', 'suggestion'), F_COMPLAINT, fb('bookingProblem', '⚠️', 'complaint'), F_SUPPORT]),
  ],

  // «Онлайн-зоомагазин»: 13 розділів за ТЗ. Породи — «папки» з наявних оголошень (drill: breed).
  pets: [
    { key: 'animals', icon: '🐶', kids: [
      { key: 'dogs', icon: '🐕', kids: [leaf('list', '📋', { drill: ['breed'] }), leaf('shop', '🛒', { business: true, directory: true, acts: ['shopApply'] })] },
      { key: 'cats', icon: '🐈', kids: [leaf('list', '📋', { drill: ['breed'] }), leaf('shop', '🛒', { business: true, directory: true, acts: ['shopApply'] })] },
      { key: 'birds', icon: '🦜', kids: [leaf('list', '📋', { drill: ['breed'] }), leaf('shop', '🛒', { business: true, directory: true, acts: ['shopApply'] })] },
      { key: 'rodents', icon: '🐹', kids: [leaf('list', '📋', { drill: ['breed'] }), leaf('shop', '🛒', { business: true, directory: true, acts: ['shopApply'] })] },
      { key: 'fish', icon: '🐠', kids: [leaf('list', '📋', { drill: ['breed'] }), leaf('shop', '🛒', { business: true, directory: true, acts: ['shopApply'] })] },
      { key: 'reptiles', icon: '🦎', kids: [leaf('list', '📋', { drill: ['breed'] }), leaf('shop', '🛒', { business: true, directory: true, acts: ['shopApply'] })] },
      { key: 'farm', icon: '🐄', kids: [leaf('list', '📋', { drill: ['breed'] }), leaf('shop', '🛒', { business: true, directory: true, acts: ['shopApply'] })] },
      { key: 'other', icon: '🐾', kids: [leaf('list', '📋', { drill: ['breed'] }), leaf('shop', '🛒', { business: true, directory: true, acts: ['shopApply'] })] },
    ] },
    { key: 'shops', icon: '🛒', kids: [
      leaf('foodDogs', '🐕', { business: true, directory: true, acts: ['shopApply'] }), leaf('foodCats', '🐈', { business: true, directory: true, acts: ['shopApply'] }), leaf('birds', '🦜', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('rodents', '🐹', { business: true, directory: true, acts: ['shopApply'] }), leaf('aquarium', '🐠', { business: true, directory: true, acts: ['shopApply'] }), leaf('reptiles', '🦎', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('farm', '🐄', { business: true, directory: true, acts: ['shopApply'] }), leaf('beds', '🛏️', { business: true, directory: true, acts: ['shopApply'] }), leaf('accessories', '🎾', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('leashes', '🦮', { business: true, directory: true, acts: ['shopApply'] }), leaf('hygiene', '🧼', { business: true, directory: true, acts: ['shopApply'] }), leaf('equipment', '🩺', { business: true, directory: true, acts: ['shopApply'] }),
      fx('newCategory', '➕', 'newDirection', 'projects.std.newCategory'),
    ] },
    { key: 'vet', icon: '🩺', kids: [
      SPEC('general', '🩺', ['consult', 'appointment', 'join']), SPEC('therapist', '💊', ['consult', 'appointment', 'join']), SPEC('surgeon', '🔪', ['consult', 'appointment', 'join']), SPEC('dermatologist', '🧴', ['consult', 'appointment', 'join']),
      SPEC('cardiologist', '❤️', ['consult', 'appointment', 'join']), SPEC('dentist', '🦷', ['consult', 'appointment', 'join']), SPEC('ophthalmologist', '👁️', ['consult', 'appointment', 'join']), SPEC('neurologist', '🧠', ['consult', 'appointment', 'join']),
      SPEC('orthopedist', '🦴', ['consult', 'appointment', 'join']), SPEC('diagnostics', '🔬', ['consult', 'appointment', 'join']), SPEC('birds', '🦜', ['consult', 'appointment', 'join']), SPEC('rodents', '🐰', ['consult', 'appointment', 'join']),
      SPEC('exotic', '🦎', ['consult', 'appointment', 'join']), SPEC('otherVet', '🏥', ['consult', 'appointment', 'join']), fx('newDirection', '➕', 'newDirection', 'projects.std.newDirection'),
    ] },
    { key: 'training', icon: '🎓', kids: [
      SPEC('dogs', '🐕', ['lesson', 'join']), SPEC('cynologists', '🦮', ['lesson', 'join']), SPEC('puppies', '🐶', ['lesson', 'join']), SPEC('behavior', '🧩', ['lesson', 'join']),
      SPEC('obedience', '✅', ['lesson', 'join']), SPEC('sport', '🏅', ['lesson', 'join']), SPEC('service', '🛡️', ['lesson', 'join']), SPEC('otherAnimals', '🐾', ['lesson', 'join']),
      fx('newDirection', '➕', 'newDirection', 'projects.std.newDirection'),
    ] },
    { key: 'grooming', icon: '✂️', kids: [
      leaf('shop', '🛒', { business: true, directory: true, acts: ['shopApply'] }),
      leaf('learning', '🎓', { acts: ['consult', 'join'] }),
      leaf('onsite', '🚗', { business: true, drill: ['country', 'city'], acts: ['groomRequest', 'shopApply', 'join'] }),
      fx('newDirection', '➕', 'newDirection', 'projects.std.newDirection'),
    ] },
    { key: 'sitting', icon: '🏠', kids: [
      leaf('need', '🙏', { acts: ['sittingRequest'] }), leaf('can', '🤲'), leaf('hotels', '🏨', { business: true, drill: ['country', 'city'], acts: ['bookPlace'] }), leaf('help', '🤝', { acts: ['join'] }),
    ] },
    { key: 'walking', icon: '🦮', kids: [leaf('need', '🙏', { acts: ['walkRequest'] }), leaf('can', '🤲', { acts: ['join'] }), fx('newDirection', '➕', 'newDirection', 'projects.std.newDirection')] },
    { key: 'travel', icon: '🧳', kids: [
      leaf('transport', '🚚', { business: true, drill: ['country'], acts: ['petTransport', 'carrierAdd'] }),
      view('docs', '📄', 'info'),
      view('rules', '📋', 'info'),
      leaf('hotels', '🏨', { business: true, drill: ['country', 'city'] }),
      { key: 'agency', icon: '✈️', href: '/projects/travel' },
    ] },
    { key: 'nutrition', icon: '🍖', kids: [
      SPEC('dogs', '🐕', ['consult', 'join']), SPEC('cats', '🐈', ['consult', 'join']), SPEC('birds', '🦜', ['consult', 'join']), SPEC('rodents', '🐹', ['consult', 'join']), SPEC('fish', '🐠', ['consult', 'join']),
      SPEC('reptiles', '🦎', ['consult', 'join']), SPEC('food', '🥫', ['consult', 'join']), SPEC('diet', '📋', ['consult', 'join']), SPEC('weight', '⚖️', ['consult', 'join']), SPEC('care', '🏡', ['consult', 'join']),
      fx('newDirection', '➕', 'newDirection', 'projects.std.newDirection'),
    ] },
    { key: 'club', icon: '🐾', href: '/clubs' },
    { key: 'support', icon: '❤️', kids: [
      leaf('shelters', '🏠', { acts: ['volunteer'] }), leaf('strays', '🐕', { acts: ['volunteer'] }), leaf('volunteers', '🙌', { acts: ['volunteer'] }), leaf('feed', '🥫', { acts: ['volunteer'] }),
      leaf('funds', '💛', { acts: ['volunteer'] }), leaf('victims', '🩹', { acts: ['volunteer'] }), leaf('owners', '🔎', { acts: ['volunteer'] }), leaf('rehome', '🤲', { acts: ['volunteer'] }),
      leaf('orgs', '🏛️', { acts: ['volunteer'] }), fx('propose', '➕', 'charityPropose'),
    ] },
    INFO([S_ABOUT, S_HOW, S_EARN, std('partnerShop', '🛍️', 'fx:partnerApply'), std('becomeVet', '🩺', 'fx:partnerApply'), std('becomeGroomer', '✂️', 'fx:partnerApply'), S_TEAM, std('partnerCarrier', '🚚', 'fx:partnerApply'), std('openShop', '🏪', 'fx:partnerApply'), std('ownTeam', '🏗️', 'repapply:open'), S_PARTNER, S_NEWS]),
    FEEDBACK([F_SUGGEST, fb('newAnimal', '🐾', 'suggestion'), fb('newSpecialists', '🩺', 'suggestion'), fb('newGoods', '🛒', 'suggestion'), F_REVIEW, fb('complaintAd', '📣', 'complaint'), fb('complaintShop', '🛍️', 'complaint'), fb('complaintSpecialist', '🧑‍⚕️', 'complaint'), F_SUPPORT]),
  ],

  // «Таксі для своїх»: 8 основних папок за ТЗ замовника. Екрани: order:* — форма замовлення, ride:* — трансфер, form:* — звернення, info — довідка, trips — мої запити
  taxi: [
    { key: 'order', icon: '🚕', kids: [view('now', '⚡', 'order:now'), view('scheduled', '🗓️', 'order:scheduled'), view('address', '📍', 'order:address'), view('class', '🚘', 'order:class'), view('wishes', '📝', 'order:wishes')] },
    { key: 'driver', icon: '🧑‍✈️', kids: [apply('register', '🪪'), view('docs', '📄', 'form:request'), view('car', '🚗', 'form:request'), view('requirements', '✅', 'info:apply'), view('cabinet', '🗂️', 'info:apply'), view('trips', '🧾', 'trips'), view('income', '💵', 'info')] },
    { key: 'team', icon: '👥', kids: [apply('create', '🏙️'), apply('region', '🗺️'), apply('country', '🌍'), { key: 'invite', icon: '📨', href: '/menu/qr' }, view('partners', '🤝', 'form:request'), apply('network', '🌐')] },
    { key: 'transfers', icon: '✈️', kids: [view('airport', '🛫', 'ride:airport'), view('station', '🚆', 'ride:station'), view('intercity', '🛣️', 'ride:intercity'), view('international', '🌍', 'ride:international'), view('group', '🚐', 'ride:group'), view('special', '♿', 'ride:special')] },
    { key: 'info', icon: 'ℹ️', kids: [view('about', '🚕', 'info'), view('how', '⚙️', 'info'), view('drivers', '🧑‍✈️', 'info:apply'), view('partner', '💼', 'info:apply'), view('regions', '🏙️', 'info:apply'), view('terms', '📃', 'info'), view('news', '📰', 'info')] },
    { key: 'help', icon: '🛟', kids: [view('passengers', '🙋', 'form:request'), view('drivers', '🧑‍✈️', 'form:request'), view('ordering', '🧾', 'form:request'), view('trip', '⚠️', 'form:request'), view('cancel', '↩️', 'form:request'), view('lost', '🎒', 'form:request'), view('faq', '❓', 'form:consult')] },
    { key: 'payment', icon: '💳', kids: [view('tariffs', '💰', 'info'), view('methods', '💳', 'info'), view('history', '🕘', 'trips'), view('receipts', '🧾', 'info'), view('settlements', '🤝', 'info'), view('fees', '📊', 'info'), view('refunds', '↩️', 'form:complaint')] },
    { key: 'feedback', icon: '⭐', kids: [view('review', '💬', 'form:suggestion'), view('rate', '⭐', 'form:suggestion'), view('complaint', '📣', 'form:complaint'), view('report', '🚨', 'form:complaint'), view('suggestion', '💡', 'form:suggestion'), view('ideas', '🚀', 'form:suggestion')] },
  ],
  clubs: [
    { key: 'interest', icon: '🤝', lk: 'projects.std.cl_interest', kids: [
      ...CLUB_LIST.map(([c, icon]) => clubNode(c, icon)),
      fx('newClub', '➕', 'newClub', 'projects.std.cl_newClub'),
      { key: 'all', icon: '🤝', href: '/clubs', lk: 'projects.std.cl_all' },
    ] },
    { key: 'shops', icon: '🛒', lk: 'projects.std.cl_shops', kids: CLUB_SHOP_CATS.map(([c, icon]) => leaf(c, icon, { business: true, acts: ['shopApply'] })) },
    INFO([S_ABOUT, S_HOW, S_EARN, S_PARTNER, stdFx('openShop', '🛍️', 'shopApply'), S_REP, stdFx('createClub', '🆕', 'newClub'), stdFx('becomeBlogger', '🎥', 'becomeBlogger'), stdFx('teachCourses', '🎓', 'offerCourse'), S_TEAM, std('growth', '📈'), S_NEWS]),
    FEEDBACK([F_SUGGEST, fb('newClub', '➕', 'suggestion'), fb('newCategory', '🗂️', 'suggestion'), fb('newCourse', '🎓', 'suggestion'), fb('newSpecialist', '🧑‍🏫', 'suggestion'), fb('error', '🐞', 'suggestion'), fb('complaintAd', '📣', 'complaint'), fb('complaintShop', '🛒', 'complaint'), fb('complaintMember', '👤', 'complaint'), F_SUPPORT]),
  ],

  antiques: [
    { key: 'things', icon: '🏺', kids: [
      { key: 'online', icon: '🛒', kids: [
        { key: 'art', icon: '🎨', kids: ANT_ART.map((k) => antLeaf(k, '🖼️')).concat([fx('newSub', '➕', 'newDirection')]) },
        ...ANT_CATS.map(([c, icon]) => antLeaf(c, icon)),
        fx('newSub', '➕', 'newDirection'),
      ] },
      leaf('offline', '🏬', { business: true, drill: GEO, acts: ['shopApply'] }),
    ] },
    { key: 'experts', icon: '🧑‍🔬', kids: [
      { key: 'appraisers', icon: '⚖️', kids: antPeople(['appraisalRequest', 'join'], ['antiques', 'coins', 'jewelry', 'metals', 'paintings', 'watches', 'furniture', 'porcelain', 'books', 'collections', 'other'], 'newDirection') },
      { key: 'authors', icon: '🔎', kids: antPeople(['consult', 'join'], ['art', 'antique', 'historical', 'numismatics', 'phaleristics', 'jewelry', 'watches', 'furniture', 'books', 'authenticity', 'other'], 'newDirection') },
      { key: 'masters', icon: '🛠️', kids: antPeople(['service', 'join'], ['paintingRestorers', 'furnitureRestorers', 'antiqueRestorers', 'watchRepair', 'jewelers', 'care', 'storage', 'photographers', 'other'], 'newSpecialty') },
      fx('newDirection', '➕', 'newDirection'),
    ] },
    INFO([S_ABOUT, S_HOW, S_EARN, S_PARTNER, S_TEAM, S_NEWS]),
    FEEDBACK([F_SUGGEST, fb('newCategory', '🗂️', 'suggestion'), fb('newSub', '📂', 'suggestion'), fb('newExpert', '🧑‍🔬', 'suggestion'), fb('error', '🐞', 'suggestion'), fb('complaintSeller', '📣', 'complaint'), fb('complaintSpecialist', '👤', 'complaint'), fb('suspicious', '🚨', 'complaint'), F_SUPPORT]),
  ],

  'export-alliance': [
    { key: 'agro', icon: '🌾', kids: EXP_AGRO.map(([c, icon, subs]) => c === 'plants'
      ? { key: c, icon, kids: [leaf('grain', icon, { business: true, drill: GEO, acts: EXP_ACTS }), { key: 'oilseeds', icon, kids: ['sunflower', 'rapeseed', 'soy'].map((x) => leaf(x, icon, { business: true, drill: GEO, acts: EXP_ACTS })) }, ...subs.slice(2).map((x) => leaf(x, icon, { business: true, drill: GEO, acts: EXP_ACTS })), fx('newDirection', '➕', 'newDirection')] }
      : expGroup(c, icon, subs, EXP_ACTS)) },
    { key: 'suppliers', icon: '🚜', kids: EXP_SUPPLY.map(([c, icon, subs]) => subs.length
      ? expGroup(c, icon, subs, ['supplierApply', 'newDirection'], { drill: ['country', 'region'] })
      : leaf(c, icon, { business: true, drill: ['country', 'region'], acts: ['supplierApply', 'newDirection'] })).concat([fx('newCategory', '➕', 'newDirection')]) },
    { key: 'markets', icon: '🌍', kids: [
      { key: 'requests', icon: '📝', kids: [fx('create', '➕', 'marketRequest'), view('all', '🔎', 'board:market'), fx('helpBuyer', '🤝', 'helpBuyer'), view('mine', '📂', 'mine:request,market')] },
      { key: 'ua', icon: '🇺🇦', kids: EXP_BUYERS.map((b) => leaf(b, '🏢', { business: true, drill: ['region', 'city'], acts: ['addCompany'] })).concat([view('rep', '🏛️', 'repapply:open')]) },
      { key: 'intl', icon: '🌐', kids: EXP_INTL.map((b) => leaf(b, '🌐', { business: true, drill: ['country', 'region', 'city'], acts: ['addCompany'] })).concat([view('rep', '🏛️', 'repapply:open'), fx('newMarket', '➕', 'newDirection')]) },
      { key: 'companies', icon: '🏭', kids: EXP_COMPANIES.map((b) => leaf(b, '🏢', { business: true, drill: GEO, acts: ['addCompany'] })) },
      { key: 'reps', icon: '🤝', kids: [fx('become', '➕', 'becomeRepresentative'), leaf('offers', '🔎', { drill: GEO, acts: ['becomeRepresentative'] }), view('mine', '📂', 'mine:specialist,request'), std('reward', '💰')] },
      { key: 'logistics', icon: '🚚', kids: EXP_LOGISTICS.map((b) => leaf(b, '🚚', { business: true, drill: GEO, acts: ['carrierAdd', 'routeCalc'] })).concat([fx('calc', '🧮', 'routeCalc')]) },
      { key: 'talks', icon: '💬', kids: [fx('offer', '📄', 'commercialOffer'), view('mine', '📂', 'mine:request'), std('terms', '📃'), std('docs', '📎')] },
      { key: 'deals', icon: '🏆', kids: [leaf('stories', '📖', { drill: GEO }), fx('share', '➕', 'shareStory')] },
    ] },
    INFO([S_ABOUT, std('mission', '🎯'), S_HOW, std('howProducers', '🌾'), S_EARN, S_PARTNER, S_REP, stdFx('intlRep', '🌐', 'becomeRepresentative'), std('withProducers', '🤝'), stdFx('withLogistics', '🚚', 'carrierAdd'), S_TEAM, S_NEWS]),
    FEEDBACK([F_SUGGEST, fb('newProductCat', '🗂️', 'suggestion'), fb('newAgroDirection', '🌱', 'suggestion'), fb('newBuyer', '🏢', 'suggestion'), fb('newMarket', '🌍', 'suggestion'), fb('newRep', '🤝', 'suggestion'), fb('newLogistics', '🚚', 'suggestion'), fb('error', '🐞', 'suggestion'), fb('complaintAd', '📣', 'complaint'), fb('complaintCompany', '🏢', 'complaint'), F_SUPPORT]),
  ],

  'dating': [
    { key: 'profiles', icon: '💌', kids: [
      leaf('view', '👀', { drill: ['country', 'region', 'city'] }),
      { key: 'add', icon: '➕', to: 'profiles.view' },
    ] },
    { key: 'dates', icon: '🥂', kids: [
      leaf('online10', '💻', { acts: ['participate'], drill: ['country', 'region', 'city'] }),
      leaf('offline10', '🌹', { acts: ['participate'], drill: ['country', 'region', 'city'] }),
      leaf('groups', '💞', { acts: ['dateRequest'], drill: ['country', 'region', 'city'] }),
      { key: 'trips', icon: '✈️', href: '/projects/travel' },
    ] },
    { key: 'hosts', icon: '🎤', kids: [
      leaf('hostsList', '🎙️', { business: true, acts: ['hostApply'], drill: ['country', 'region', 'city'] }),
      leaf('bloggers', '📹', { business: true, acts: ['hostApply'], drill: ['country', 'region', 'city'] }),
      leaf('streamers', '🔴', { business: true, acts: ['hostApply'], drill: ['country', 'region', 'city'] }),
      { key: 'addHost', icon: '➕', kind: 'fx:hostApply' },
    ] },
    { key: 'travel', icon: '✈️', kids: [
      { key: 'romantic', icon: '🌍', kind: 'fx:tourRequest' },
      { key: 'meet', icon: '❤️', kind: 'fx:tourRequest' },
      { key: 'flights', icon: '✈️', kind: 'fx:ticketRequest' },
      { key: 'group', icon: '👫', kind: 'fx:tourRequest' },
      { key: 'agency', icon: '🧳', href: '/projects/travel' },
    ] },
    { key: 'info', icon: '🤝', kids: [
      { key: 'about', icon: '📖', kind: 'info' },
      { key: 'earn', icon: '💰', kind: 'info' },
      { key: 'organizer', icon: '👥', kind: 'repapply:open' },
      { key: 'becomeHost', icon: '🎤', kind: 'fx:hostApply' },
      { key: 'partner', icon: '🤝', kind: 'fx:partnerApply' },
      { key: 'team', icon: '📝', kind: 'fx:teamApply' },
    ] },
    { key: 'feedback', icon: '💬', kids: [
      { key: 'idea', icon: '💡', kind: 'forma:suggestion' },
      { key: 'problem', icon: '⚠️', kind: 'forma:complaint' },
      { key: 'fake', icon: '🎭', kind: 'forma:complaint' },
      { key: 'admin', icon: '📩', kind: 'form:consult' },
    ] },
  ],
  'mystic': [
    { key: 'experts', icon: '🔮', kids: [
      leaf('tarot', '🃏', { business: true, acts: ['consult', 'specialistApply'], drill: ['country', 'region', 'city'] }),
      leaf('astro', '🌙', { business: true, acts: ['consult', 'specialistApply'], drill: ['country', 'region', 'city'] }),
      leaf('numerology', '🔢', { business: true, acts: ['consult', 'specialistApply'], drill: ['country', 'region', 'city'] }),
      leaf('esoterics', '✨', { business: true, acts: ['consult', 'specialistApply'], drill: ['country', 'region', 'city'] }),
      leaf('practices', '🔮', { business: true, acts: ['consult', 'specialistApply'], drill: ['country', 'region', 'city'] }),
      leaf('predictions', '🔭', { business: true, acts: ['consult', 'specialistApply'], drill: ['country', 'region', 'city'] }),
      leaf('bloggers', '🎤', { business: true, acts: ['specialistApply'], drill: ['country', 'region', 'city'] }),
      leaf('live', '🔴', { business: true, acts: ['specialistApply'] }),
      leaf('records', '🎬'),
      leaf('courses', '🎓', { acts: ['offerCourse'] }),
      { key: 'booking', icon: '📅', kind: 'fx:appointment' },
      { key: 'apply', icon: '➕', kind: 'fx:specialistApply' },
    ] },
    { key: 'info', icon: '🤝', kids: [
      { key: 'about', icon: '📖', kind: 'info' },
      { key: 'earn', icon: '💰', kind: 'info' },
      { key: 'host', icon: '🎤', kind: 'fx:specialistApply' },
      { key: 'organizer', icon: '🏙️', kind: 'repapply:open' },
      { key: 'partner', icon: '🌍', kind: 'fx:partnerApply' },
      { key: 'team', icon: '📝', kind: 'fx:teamApply' },
    ] },
    { key: 'feedback', icon: '💬', kids: [
      { key: 'idea', icon: '💡', kind: 'forma:suggestion' },
      { key: 'problem', icon: '⚠️', kind: 'forma:complaint' },
      { key: 'admin', icon: '📩', kind: 'form:consult' },
    ] },
  ],
  'grants': [
    { key: 'donors', icon: '📂', kids: [
      { key: 'howto', icon: 'ℹ️', kind: 'info' },
      leaf('state', '🏛️', { acts: ['addGrant'], drill: ['country', 'region'] }),
      leaf('international', '🌍', { acts: ['addGrant'], drill: ['country', 'region'] }),
      leaf('funds', '🎗️', { acts: ['addGrant'], drill: ['country', 'region'] }),
      leaf('ngo', '🤝', { acts: ['addGrant'], drill: ['country', 'region'] }),
      leaf('business', '🏢', { acts: ['addGrant'], drill: ['country', 'region'] }),
      leaf('startups', '💡', { acts: ['addGrant'], drill: ['country', 'region'] }),
      { key: 'add', icon: '➕', kind: 'fx:addGrant' },
    ] },
    { key: 'writers', icon: '👨‍💼', kids: [
      leaf('agro', '🌾', { business: true, acts: ['grantConsult', 'grantSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('biz', '🏢', { business: true, acts: ['grantConsult', 'grantSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('ngo', '🤝', { business: true, acts: ['grantConsult', 'grantSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('veterans', '🪖', { business: true, acts: ['grantConsult', 'grantSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('education', '🎓', { business: true, acts: ['grantConsult', 'grantSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('medical', '🏥', { business: true, acts: ['grantConsult', 'grantSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('eco', '🌱', { business: true, acts: ['grantConsult', 'grantSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('culture', '🎨', { business: true, acts: ['grantConsult', 'grantSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('it', '💻', { business: true, acts: ['grantConsult', 'grantSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('communities', '🏘️', { business: true, acts: ['grantConsult', 'grantSpecialist'], drill: ['country', 'region', 'city'] }),
      { key: 'become', icon: '➕', kind: 'fx:grantSpecialist' },
    ] },
    { key: 'success', icon: '🏆', kids: [
      leaf('ngo', '🤝', { acts: ['addSuccess'], drill: ['country', 'region'] }),
      leaf('veterans', '🪖', { acts: ['addSuccess'], drill: ['country', 'region'] }),
      leaf('business', '🏢', { acts: ['addSuccess'], drill: ['country', 'region'] }),
      leaf('farming', '🌾', { acts: ['addSuccess'], drill: ['country', 'region'] }),
      leaf('education', '🎓', { acts: ['addSuccess'], drill: ['country', 'region'] }),
      leaf('international', '🌍', { acts: ['addSuccess'], drill: ['country', 'region'] }),
      { key: 'add', icon: '➕', kind: 'fx:addSuccess' },
    ] },
    { key: 'help', icon: '📝', kids: [
      { key: 'write', icon: '📝', kind: 'fx:grantWrite' },
      { key: 'idea', icon: '💡', kind: 'fx:grantIdea' },
      { key: 'find', icon: '🔎', kind: 'fx:grantFind' },
      { key: 'org', icon: '🏢', kind: 'fx:grantOrg' },
      { key: 'consult', icon: '🤝', kind: 'fx:grantConsult' },
      { key: 'mine', icon: '📂', kind: 'mine:request,specialist' },
    ] },
    { key: 'info', icon: '🤝', kids: [
      { key: 'about', icon: '📖', kind: 'info' },
      { key: 'join', icon: '🤝', kind: 'fx:teamApply' },
      { key: 'specialists', icon: '👨‍💼', kind: 'fx:grantSpecialist' },
      { key: 'partner', icon: '🌍', kind: 'fx:partnerApply' },
      { key: 'earn', icon: '💰', kind: 'info' },
      { key: 'learning', icon: '📚', kind: 'info' },
    ] },
    { key: 'feedback', icon: '💬', kids: [
      { key: 'idea', icon: '💡', kind: 'forma:suggestion' },
      { key: 'complaint', icon: '📣', kind: 'forma:complaint' },
      { key: 'fraud', icon: '🚨', kind: 'forma:complaint' },
      { key: 'admin', icon: '📩', kind: 'form:consult' },
    ] },
  ],
  'beauty': [
    { key: 'specialists', icon: '💅', kids: [
      leaf('makeup', '💄', { business: true, acts: ['appointment', 'becomeSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('stylists', '👗', { business: true, acts: ['appointment', 'becomeSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('hair', '💇', { business: true, acts: ['appointment', 'becomeSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('nails', '💅', { business: true, acts: ['appointment', 'becomeSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('cosmetology', '🧖', { business: true, acts: ['appointment', 'becomeSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('injection', '💉', { business: true, acts: ['appointment', 'becomeSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('aesthetic', '🩺', { business: true, acts: ['appointment', 'becomeSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('body', '⚖️', { business: true, acts: ['appointment', 'becomeSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('devices', '🔬', { business: true, acts: ['appointment', 'becomeSpecialist'], drill: ['country', 'region', 'city'] }),
      leaf('other', '✨', { business: true, acts: ['appointment', 'becomeSpecialist'], drill: ['country', 'region', 'city'] }),
      { key: 'newDirection', icon: '➕', kind: 'fx:newDirection' },
    ] },
    { key: 'education', icon: '🎓', kids: [
      leaf('medical', '🩺', { acts: ['applyCourse', 'createGroup', 'offerCourse'], drill: ['country', 'region', 'city'] }),
      leaf('injection', '💉', { acts: ['applyCourse', 'createGroup', 'offerCourse'], drill: ['country', 'region', 'city'] }),
      leaf('skin', '🧖', { acts: ['applyCourse', 'createGroup', 'offerCourse'], drill: ['country', 'region', 'city'] }),
      leaf('hair', '💇', { acts: ['applyCourse', 'createGroup', 'offerCourse'], drill: ['country', 'region', 'city'] }),
      leaf('nails', '💅', { acts: ['applyCourse', 'createGroup', 'offerCourse'], drill: ['country', 'region', 'city'] }),
      leaf('makeup', '💄', { acts: ['applyCourse', 'createGroup', 'offerCourse'], drill: ['country', 'region', 'city'] }),
      leaf('devices', '🔬', { acts: ['applyCourse', 'createGroup', 'offerCourse'], drill: ['country', 'region', 'city'] }),
      leaf('other', '✨', { acts: ['applyCourse', 'createGroup', 'offerCourse'], drill: ['country', 'region', 'city'] }),
    ] },
    { key: 'shops', icon: '🛒', kids: [
      leaf('care', '🧴', { business: true, acts: ['shopApply'] }),
      leaf('nailGoods', '💅', { business: true, acts: ['shopApply'] }),
      leaf('hairGoods', '💇', { business: true, acts: ['shopApply'] }),
      leaf('equipment', '🔬', { business: true, acts: ['shopApply'] }),
      leaf('pro', '🧪', { business: true, acts: ['shopApply'] }),
      leaf('furniture', '🪑', { business: true, acts: ['shopApply'] }),
      leaf('makers', '🏭', { business: true, acts: ['shopApply'] }),
      leaf('news', '🆕', { business: true, acts: ['shopApply'] }),
      { key: 'add', icon: '➕', kind: 'fx:shopApply' },
    ] },
    { key: 'work', icon: '💼', kids: [
      { key: 'findJob', icon: '🔎', kind: 'fx:jobSeeker' },
      leaf('findSpecialist', '🧑‍🔧', { drill: ['country', 'region', 'city'] }),
      leaf('salons', '🏢', { acts: ['offerWork'], drill: ['country', 'region', 'city'] }),
      leaf('clients', '🙋', { drill: ['country', 'region', 'city'] }),
      { key: 'rent', icon: '🪑', kind: 'fx:rentRequest' },
      leaf('home', '🏠', { drill: ['country', 'region', 'city'] }),
      leaf('abroad', '🌍', { drill: ['country', 'region', 'city'] }),
      { key: 'vacancy', icon: '➕', kind: 'fx:offerWork' },
    ] },
    { key: 'info', icon: '🤝', kids: [
      { key: 'about', icon: '📖', kind: 'info' },
      { key: 'team', icon: '🤝', kind: 'fx:teamApply' },
      { key: 'partner', icon: '🌍', kind: 'fx:partnerApply' },
      { key: 'earn', icon: '💰', kind: 'info' },
      { key: 'ads', icon: '📣', kind: 'fx:partnerApply' },
      { key: 'growth', icon: '🌐', kind: 'repapply:open' },
      { key: 'teamTraining', icon: '🎓', kind: 'info' },
    ] },
    { key: 'feedback', icon: '💬', kids: [
      { key: 'idea', icon: '💡', kind: 'forma:suggestion' },
      { key: 'complaint', icon: '📣', kind: 'forma:complaint' },
      { key: 'violation', icon: '⚠️', kind: 'forma:complaint' },
      { key: 'complaintSpecialist', icon: '👤', kind: 'forma:complaint' },
      { key: 'complaintShop', icon: '🛒', kind: 'forma:complaint' },
      { key: 'admin', icon: '📩', kind: 'form:consult' },
    ] },
    { key: 'cabinet', icon: '🙋', kids: [
      { key: 'profile', icon: '👤', kind: 'fx:becomeSpecialist' },
      { key: 'mine', icon: '📂', kind: 'mine:request,specialist' },
      { key: 'appointments', icon: '📝', kind: 'fx:appointment' },
    ] },
  ],
  'notable': [
    { key: 'magazine', icon: '📖', kids: [
      leaf('nextIssue', '📰', { acts: ['nominate', 'nominateOther'], drill: ['country', 'region', 'city'] }),
      { key: 'team', icon: '🧑‍🎨', kids: [
        leaf('chiefEditor', '👑', { acts: ['joinTeam'] }),
        leaf('editors', '📝', { acts: ['joinTeam'] }),
        leaf('journalists', '✍️', { acts: ['joinTeam'] }),
        leaf('interviewers', '🎙️', { acts: ['joinTeam'] }),
        leaf('photographers', '📷', { acts: ['joinTeam'] }),
        leaf('videographers', '🎥', { acts: ['joinTeam'] }),
        leaf('designers', '🎨', { acts: ['joinTeam'] }),
        leaf('layout', '📐', { acts: ['joinTeam'] }),
        leaf('proofreaders', '🔤', { acts: ['joinTeam'] }),
        leaf('copywriters', '✒️', { acts: ['joinTeam'] }),
        leaf('reviewers', '🧐', { acts: ['joinTeam'] }),
        leaf('smm', '📱', { acts: ['joinTeam'] }),
        leaf('pr', '📣', { acts: ['joinTeam'] }),
        leaf('managers', '💼', { acts: ['joinTeam'] }),
        leaf('coordinators', '🧭', { acts: ['joinTeam'] }),
      ] },
      { key: 'apply', icon: '✍️', kids: [
        { key: 'self', icon: '🙋', kind: 'fx:nominate' },
        { key: 'other', icon: '🌟', kind: 'fx:nominateOther' },
      ] },
    ] },
    { key: 'records', icon: '🏅', kids: [
      leaf('nextIssue', '🏆', { business: true, acts: ['recordApply', 'recordOther'], drill: ['country', 'region', 'city'] }),
      { key: 'team', icon: '🧑‍⚖️', kids: [
        leaf('chiefEditor', '👑', { acts: ['joinTeam'] }),
        leaf('experts', '🧠', { acts: ['joinTeam'] }),
        leaf('verifiers', '✅', { acts: ['joinTeam'] }),
        leaf('journalists', '✍️', { acts: ['joinTeam'] }),
        leaf('interviewers', '🎙️', { acts: ['joinTeam'] }),
        leaf('photographers', '📷', { acts: ['joinTeam'] }),
        leaf('videographers', '🎥', { acts: ['joinTeam'] }),
        leaf('designers', '🎨', { acts: ['joinTeam'] }),
        leaf('lawyer', '⚖️', { acts: ['joinTeam'] }),
        leaf('translators', '🌐', { acts: ['joinTeam'] }),
        leaf('archivists', '🗄️', { acts: ['joinTeam'] }),
        leaf('coordinators', '🧭', { acts: ['joinTeam'] }),
      ] },
      { key: 'apply', icon: '✍️', kids: [
        { key: 'self', icon: '🙋', kind: 'fx:recordApply' },
        { key: 'other', icon: '🌟', kind: 'fx:recordOther' },
      ] },
      { key: 'mine', icon: '📂', kind: 'mine:suggestion,request' },
    ] },
    { key: 'archive', icon: '📚', kids: [
      leaf('magazines', '📕'),
      leaf('books', '📗'),
    ] },
    { key: 'info', icon: '🤝', kids: [
      { key: 'about', icon: '📖', kind: 'info' },
      { key: 'how', icon: '⚙️', kind: 'info' },
      { key: 'earn', icon: '💰', kind: 'info' },
      { key: 'partner', icon: '🤝', kind: 'fx:partnerApply' },
      { key: 'rep', icon: '🌍', kind: 'repapply:open' },
    ] },
    { key: 'feedback', icon: '💬', kids: [
      { key: 'idea', icon: '💡', kind: 'forma:suggestion' },
      { key: 'complaint', icon: '📣', kind: 'forma:complaint' },
      { key: 'error', icon: '🐞', kind: 'forma:suggestion' },
      { key: 'other', icon: '❓', kind: 'form:consult' },
    ] },
  ],
  'media-network': [
    { key: 'authors', icon: '👥', kids: [
      leaf('journalists', '🎙️', { business: true, acts: ['becomeAuthor'], drill: ['country', 'region', 'city'] }),
      leaf('bloggers', '📹', { business: true, acts: ['becomeAuthor'], drill: ['country', 'region', 'city'] }),
      leaf('active', '🙋', { business: true, acts: ['becomeAuthor'], drill: ['country', 'region', 'city'] }),
      { key: 'become', icon: '➕', kind: 'fx:becomeAuthor' },
    ] },
    { key: 'events', icon: '📍', kids: [
      leaf('good', '😊', { drill: ['country', 'region', 'city'] }),
      leaf('problems', '⚠️', { drill: ['country', 'region', 'city'] }),
      leaf('reports', '🎥', { drill: ['country', 'region', 'city'] }),
      { key: 'mine', icon: '📂', kind: 'mine:request' },
    ] },
    { key: 'laws', icon: '⚖️', kids: [
      leaf('feed', '🏛️', { drill: ['country', 'region'] }),
      { key: 'howto', icon: 'ℹ️', kind: 'info' },
    ] },
    { key: 'life', icon: '💼', kids: [
      leaf('work', '💼', { drill: ['country', 'region', 'city'] }),
      leaf('housing', '🏠', { drill: ['country', 'region', 'city'] }),
      leaf('documents', '📄', { drill: ['country', 'region', 'city'] }),
      leaf('community', '🏘️', { drill: ['country', 'region', 'city'] }),
    ] },
    { key: 'info', icon: '🤝', kids: [
      { key: 'about', icon: '📖', kind: 'info' },
      { key: 'earn', icon: '💰', kind: 'info' },
      { key: 'join', icon: '🤝', kind: 'fx:teamApply' },
      { key: 'local', icon: '🌍', kind: 'repapply:open' },
    ] },
    { key: 'feedback', icon: '💬', kids: [
      { key: 'suggestions', icon: '💡', kind: 'forma:suggestion' },
      { key: 'complaints', icon: '📣', kind: 'forma:complaint' },
    ] },
  ],
  'cooperatives': [
    { key: 'projects', icon: '📂', kids: [
      leaf('list', '🗂️', { acts: ['joinProject', 'proposeProject'], drill: ['country', 'region', 'city'] }),
      { key: 'propose', icon: '➕', kind: 'fx:proposeProject' },
      { key: 'mine', icon: '📂', kind: 'mine:request,suggestion' },
    ] },
    { key: 'land', icon: '🏞️', kids: [
      leaf('plots', '🌳', { acts: ['addOpportunity'], drill: ['country', 'region', 'city'] }),
      leaf('houses', '🏠', { acts: ['addOpportunity'], drill: ['country', 'region', 'city'] }),
      leaf('villages', '🏚️', { acts: ['addOpportunity'], drill: ['country', 'region', 'city'] }),
      leaf('farms', '🌾', { acts: ['addOpportunity'], drill: ['country', 'region', 'city'] }),
      leaf('programs', '🧳', { acts: ['addOpportunity'], drill: ['country', 'region', 'city'] }),
      { key: 'add', icon: '➕', kind: 'fx:addOpportunity' },
    ] },
    { key: 'specialists', icon: '🛠️', kids: [
      leaf('builders', '🏗️', { business: true, acts: ['consult', 'join'], drill: ['country', 'region', 'city'] }),
      leaf('agro', '🌾', { business: true, acts: ['consult', 'join'], drill: ['country', 'region', 'city'] }),
      leaf('managers', '💼', { business: true, acts: ['consult', 'join'], drill: ['country', 'region', 'city'] }),
      leaf('lawyers', '⚖️', { business: true, acts: ['consult', 'join'], drill: ['country', 'region', 'city'] }),
      leaf('finance', '💰', { business: true, acts: ['consult', 'join'], drill: ['country', 'region', 'city'] }),
      leaf('it', '💻', { business: true, acts: ['consult', 'join'], drill: ['country', 'region', 'city'] }),
      leaf('logistics', '🚚', { business: true, acts: ['consult', 'join'], drill: ['country', 'region', 'city'] }),
      leaf('other', '✨', { business: true, acts: ['consult', 'join'], drill: ['country', 'region', 'city'] }),
      { key: 'createTeam', icon: '👥', kind: 'fx:createTeam' },
    ] },
    { key: 'earn', icon: '💰', kids: [
      { key: 'business', icon: '🤝', kind: 'info' },
      { key: 'production', icon: '🌾', kind: 'info' },
      { key: 'building', icon: '🏗️', kind: 'info' },
      { key: 'partnership', icon: '🤝', kind: 'info' },
      { key: 'own', icon: '🚀', kind: 'fx:proposeProject' },
    ] },
    { key: 'feedback', icon: '💬', kids: [
      { key: 'idea', icon: '💡', kind: 'forma:suggestion' },
      { key: 'development', icon: '📈', kind: 'forma:suggestion' },
      { key: 'complaintProject', icon: '📣', kind: 'forma:complaint' },
      { key: 'complaintMember', icon: '👤', kind: 'forma:complaint' },
      { key: 'admin', icon: '📩', kind: 'form:consult' },
    ] },
  ],
  'apps': [
    { key: 'apps', icon: '📱', kids: [
      leaf('finance', '💰', { drill: ['country', 'region'] }),
      leaf('travel', '🧭', { drill: ['country', 'region'] }),
      leaf('learning', '🎓', { drill: ['country', 'region'] }),
      leaf('other', '✨', { drill: ['country', 'region'] }),
    ] },
    { key: 'ideas', icon: '💡', kids: [
      leaf('app', '📱', { acts: ['projectContact'], drill: ['country', 'region'] }),
      leaf('game', '🎮', { acts: ['projectContact'], drill: ['country', 'region'] }),
      leaf('unfinished', '🛠️', { acts: ['projectContact'], drill: ['country', 'region'] }),
      leaf('partners', '🤝', { acts: ['projectContact'], drill: ['country', 'region'] }),
    ] },
    { key: 'people', icon: '🧑‍💻', kids: [
      leaf('developers', '💻', { business: true, acts: ['devApply', 'consult'], drill: ['country', 'region', 'city'] }),
      leaf('designers', '🎨', { business: true, acts: ['devApply', 'consult'], drill: ['country', 'region', 'city'] }),
      leaf('gameDevs', '🎮', { business: true, acts: ['devApply', 'consult'], drill: ['country', 'region', 'city'] }),
      leaf('testers', '🧪', { business: true, acts: ['becomeTester'], drill: ['country', 'region', 'city'] }),
      { key: 'apply', icon: '➕', kind: 'fx:devApply' },
      { key: 'tester', icon: '🧪', kind: 'fx:becomeTester' },
    ] },
    { key: 'info', icon: '🤝', kids: [
      { key: 'about', icon: '📖', kind: 'info' },
      { key: 'earn', icon: '💰', kind: 'info' },
      { key: 'team', icon: '👥', kind: 'fx:teamApply' },
      { key: 'local', icon: '🌍', kind: 'repapply:open' },
    ] },
    { key: 'feedback', icon: '💬', kids: [
      { key: 'suggestions', icon: '💡', kind: 'forma:suggestion' },
      { key: 'complaints', icon: '📣', kind: 'forma:complaint' },
    ] },
    { key: 'ours', icon: '🏭', kids: [
      leaf('apps', '📱'),
      leaf('games', '🎮'),
    ] },
  ],
  'rebuild': [
    { key: 'intl', icon: '🌐', kids: [
      leaf('funds', '🏦', { acts: ['proposeCoop'], drill: ['country', 'region', 'city'] }),
      leaf('ngos', '🎗️', { acts: ['proposeCoop'], drill: ['country', 'region', 'city'] }),
      leaf('investors', '💼', { acts: ['proposeCoop'], drill: ['country', 'region', 'city'] }),
      leaf('builders', '🏗️', { acts: ['proposeCoop'], drill: ['country', 'region', 'city'] }),
      leaf('suppliers', '📦', { acts: ['proposeCoop'], drill: ['country', 'region', 'city'] }),
      { key: 'offer', icon: '➕', kind: 'fx:proposeCoop' },
    ] },
    { key: 'ua', icon: '🇺🇦', kids: [
      leaf('ngos', '🎗️', { business: true, acts: ['readyCoop'], drill: ['country', 'region', 'city'] }),
      leaf('business', '🏢', { business: true, acts: ['readyCoop'], drill: ['country', 'region', 'city'] }),
      leaf('teams', '👥', { business: true, acts: ['readyCoop'], drill: ['country', 'region', 'city'] }),
      leaf('people', '🧑‍🔧', { business: true, acts: ['readyCoop'], drill: ['country', 'region', 'city'] }),
      leaf('communities', '🏘️', { business: true, acts: ['readyCoop'], drill: ['country', 'region', 'city'] }),
      { key: 'ready', icon: '🤝', kind: 'fx:readyCoop' },
    ] },
    { key: 'projects', icon: '🏗️', kids: [
      leaf('done', '✅', { drill: ['country', 'region'] }),
      leaf('active', '🚧', { acts: ['joinProject'], drill: ['country', 'region'] }),
      { key: 'teams', icon: '👥', kids: [
        leaf('building', '🏗️', { acts: ['joinProject', 'teamApply'], drill: ['country', 'region', 'city'] }),
        leaf('humanitarian', '📦', { acts: ['joinProject', 'teamApply'], drill: ['country', 'region', 'city'] }),
        leaf('business', '🏭', { acts: ['joinProject', 'teamApply'], drill: ['country', 'region', 'city'] }),
        leaf('social', '🏫', { acts: ['joinProject', 'teamApply'], drill: ['country', 'region', 'city'] }),
        leaf('logistics', '🚚', { acts: ['joinProject', 'teamApply'], drill: ['country', 'region', 'city'] }),
        leaf('agro', '🌾', { acts: ['joinProject', 'teamApply'], drill: ['country', 'region', 'city'] }),
        leaf('tech', '💻', { acts: ['joinProject', 'teamApply'], drill: ['country', 'region', 'city'] }),
        leaf('partnership', '🌍', { acts: ['joinProject', 'teamApply'], drill: ['country', 'region', 'city'] }),
      ] },
    ] },
    { key: 'earn', icon: '💰', kids: [
      { key: 'building', icon: '🏗️', kind: 'info' },
      { key: 'production', icon: '🏭', kind: 'info' },
      { key: 'supply', icon: '🚚', kind: 'info' },
      { key: 'partnership', icon: '🌍', kind: 'info' },
      { key: 'specialists', icon: '🧑‍🔧', kind: 'fx:readyCoop' },
      { key: 'own', icon: '🚀', kind: 'fx:proposeCoop' },
    ] },
    { key: 'feedback', icon: '💬', kids: [
      { key: 'newProject', icon: '🏗️', kind: 'forma:suggestion' },
      { key: 'coopOffer', icon: '🤝', kind: 'forma:suggestion' },
      { key: 'platform', icon: '📈', kind: 'forma:suggestion' },
      { key: 'complaintProject', icon: '📣', kind: 'forma:complaint' },
      { key: 'complaintMember', icon: '👤', kind: 'forma:complaint' },
      { key: 'admin', icon: '📩', kind: 'form:consult' },
    ] },
  ],

  // «Міжнародні ярмарки української продукції»: 4 кнопки за ТЗ
  trade: [
    leaf('producers', '🏭', { acts: ['tradeProducer!'] }),
    { key: 'organizers', icon: '🎪', kids: [leaf('self', '🎪', { acts: ['organizerSelf!'] }), leaf('member', '🤝', { acts: ['organizerMember!'] }), leaf('venue', '🏛️', { acts: ['organizerVenue!'] })] },
    INFO([S_ABOUT, S_HOW, S_EARN, S_REP, S_TEAM, S_PARTNER, S_NEWS]),
    FEEDBACK([F_SUGGEST, F_DIRECTION, F_COMPLAINT, fb('organizerProblem', '🎪', 'complaint'), fb('producerProblem', '🏭', 'complaint'), F_REVIEW, fb('other', '❓', 'suggestion')]),
  ],
};

export const PROJECT_FOLDERS: Record<string, ProjectFolder[]> = (() => {
  const out: Record<string, ProjectFolder[]> = {};
  Object.keys(SPECS).forEach((slug) => { out[slug] = build(slug, SPECS[slug], []); });
  // «Крамниця»: усі відділи ведуть до бізнес-кабінетів, а не до стрічки товарів
  const mark = (nodes: ProjectFolder[]) => nodes.forEach((n) => { if (n.sectionId && n.business && !n.drill) n.directory = true; if (n.children) mark(n.children); });
  mark(out['shops'] || []);
  return out;
})();

export function foldersFor(slug: string): ProjectFolder[] {
  return PROJECT_FOLDERS[slug] ?? [];
}

/** Знаходить папку за шляхом `a`, `a.b`, `a.b.c` … (вкладеність будь-якої глибини). */
export function findFolder(slug: string, path: string | null): { folder: ProjectFolder; parent?: ProjectFolder } | null {
  if (!path) return null;
  let nodes = foldersFor(slug);
  let node: ProjectFolder | undefined;
  let parent: ProjectFolder | undefined;
  for (const key of path.split('.')) {
    const next = nodes.find((f) => f.key === key);
    if (!next) return null;
    parent = node;
    node = next;
    nodes = next.children ?? [];
  }
  return node ? { folder: node, parent } : null;
}

export interface SectionLeaf {
  id: string;
  business: boolean;
  derive?: Record<string, string>;
}

/** Усі кінцеві розділи проєкту (куди можна подати оголошення). */
export function sectionLeaves(slug: string): SectionLeaf[] {
  const out: SectionLeaf[] = [];
  const walk = (nodes: ProjectFolder[]) => {
    nodes.forEach((n) => {
      if (n.children) walk(n.children);
      else if (n.sectionId) out.push({ id: n.sectionId, business: !!n.business, derive: n.derive });
    });
  };
  walk(foldersFor(slug));
  return out;
}

export function hasSections(slug: string): boolean {
  return foldersFor(slug).length > 0;
}

/** Розділ проєкту за ідентифікатором (для перевірок на сервері та у формі). */
export function findSection(slug: string, id: string | null | undefined): SectionLeaf | null {
  if (!id) return null;
  return sectionLeaves(slug).find((s) => s.id === id) ?? null;
}

/** Ідентифікатор «заявки» (кабінет, команда, новий напрям) для посилання на сторінку «Як заробити». */
export function applyIdOf(slug: string, path: string[]): string {
  return sectionIdOf(slug, path);
}

/** Ключі перекладу шляху до розділу: [батьківська, дочірня]. Для підпису в списках (Лікарі › Терапевт). */
export function sectionLabelKeys(slug: string, id: string): string[] {
  let found: string[] = [];
  const walk = (nodes: ProjectFolder[], trail: string[]) => {
    nodes.forEach((n) => {
      const next = trail.concat(n.labelKey);
      if (n.sectionId === id) found = next;
      else if (n.children) walk(n.children, next);
    });
  };
  walk(foldersFor(slug), []);
  return found;
}

/** Ключ перекладу назви заявки (кабінет, команда, новий напрям) за її ідентифікатором; null — такої заявки в проєкті немає. */
export function applyLabelKey(slug: string, id: string | null | undefined): string | null {
  if (!id) return null;
  let key: string | null = null;
  const walk = (nodes: ProjectFolder[], parents: string[]) => {
    nodes.forEach((n) => {
      const path = parents.concat(n.key);
      if ((n.apply && sectionIdOf(slug, path) === id) || (n.sectionId && n.sectionId === id)) key = n.labelKey;
      if (n.children) walk(n.children, path);
    });
  };
  walk(foldersFor(slug), []);
  return key;
}
