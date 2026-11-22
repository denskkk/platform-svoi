/**
 * «Папки» всередині проєкту: людина заходить у проєкт і йде по папках-«кубиках» (лікарі → кардіологи, купити / орендувати тощо).
 * Кінцева папка = розділ оголошень: оголошення потрапляє в неї через поле `section`, а каталог показує лише її (фільтр f_section).
 * Папки задаються описом нижче (без нових таблиць). Назви — в messages/<мова>/listings.json → options.section.<id>.
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
  /** Не каталог: спеціальний екран (форма замовлення, інформація, заявка-форма). Використовує «Таксі для своїх» */
  kind?: string;
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
}

const slugId = (slug: string) => slug.replace(/-/g, '_');

/** Ідентифікатор розділу: <slug>_<батьківська>_<дочірня>. Дефіси замінено на «_», щоб підходило для ключів перекладу. */
export function sectionIdOf(slug: string, path: string[]): string {
  return [slugId(slug)].concat(path).join('_');
}

function build(slug: string, specs: Spec[], parents: string[]): ProjectFolder[] {
  return specs.map((s) => {
    const path = parents.concat(s.key);
    const id = sectionIdOf(slug, path);
    const node: ProjectFolder = { key: s.key, icon: s.icon, labelKey: `listings.options.section.${id}`, filters: {} };
    if (s.kids) {
      node.children = build(slug, s.kids, path);
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
    }
    return node;
  });
}

const leaf = (key: string, icon: string, extra?: Partial<Spec>): Spec => ({ key, icon, ...extra });
const apply = (key: string, icon = '➕'): Spec => ({ key, icon, apply: true });
const view = (key: string, icon: string, kind: string): Spec => ({ key, icon, kind });

/** Специфікація папок за ТЗ замовника (скріншоти та голосові). Порядок = порядок на екрані. */
const SPECS: Record<string, Spec[]> = {
  lawyers: [
    leaf('advocates', '⚖️', { business: true }),
    apply('cabinet', '🗂️'),
    apply('team', '👥'),
  ],
  'real-estate': [
    leaf('sale', '🏠', { derive: { dealType: 'sale' } }),
    leaf('rent', '🔑', { derive: { dealType: 'rent' } }),
    { key: 'home', icon: '🛋️', kids: [leaf('sell', '💰'), leaf('free', '🎁'), leaf('moving', '🚚')] },
  ],
  jobs: [
    leaf('vacancies', '💼', { derive: { jobKind: 'vacancy' } }),
    leaf('seekers', '🔎', { derive: { jobKind: 'resume' } }),
  ],
  cars: [
    leaf('buy', '🚗'),
    leaf('rent', '🔑'),
    leaf('shops', '🛒', { business: true }),
  ],
  shops: [
    { key: 'food', icon: '🥩', kids: [leaf('meat', '🥩', { business: true }), leaf('fish', '🐟', { business: true }), leaf('dairy', '🥛', { business: true }), apply('addDept', '➕')] },
    { key: 'clothes', icon: '👗', kids: [leaf('women', '👗', { business: true }), leaf('men', '👔', { business: true }), leaf('kids', '🧒', { business: true }), leaf('shoes', '👟', { business: true }), apply('addDept', '➕')] },
    { key: 'chemistry', icon: '🧴', kids: [leaf('household', '🧽', { business: true }), leaf('cosmetics', '💄', { business: true }), apply('addDept', '➕')] },
    { key: 'souvenirs', icon: '🎁', kids: [leaf('handmade', '🧵', { business: true }), leaf('symbols', '🇺🇦', { business: true }), leaf('giftsets', '🎀', { business: true }), apply('addDept', '➕')] },
    { key: 'electro', icon: '🔌', kids: [leaf('appliances', '🔌', { business: true }), leaf('lighting', '💡', { business: true }), leaf('gadgets', '📱', { business: true }), apply('addDept', '➕')] },
    { key: 'delivery', icon: '🚚', kids: [leaf('fromUa', '🚚', { business: true }), leaf('europe', '🚛', { business: true }), leaf('request', '📮')] },
    { key: 'abroad', icon: '🌍', kids: [leaf('stores', '🏪', { business: true }), leaf('warehouses', '🏭', { business: true })] },
  ],
  health: [
    { key: 'doctors', icon: '🩺', kids: [leaf('family', '👨‍⚕️', { business: true }), leaf('therapist', '🧑‍⚕️', { business: true }), leaf('pediatrician', '👶', { business: true }), leaf('dermatologist', '🧴', { business: true }), leaf('allergist', '🤧', { business: true }), apply('newDirection')] },
    { key: 'nutrition', icon: '🥗', kids: [leaf('dietitian', '🥗', { business: true }), leaf('sportNutrition', '💪', { business: true }), leaf('healthyEating', '🍎', { business: true }), leaf('childNutrition', '🍼', { business: true }), apply('newDirection')] },
    { key: 'sport', icon: '🏋️', kids: [leaf('personal', '🎯', { business: true }), leaf('fitness', '🏋️', { business: true }), leaf('yoga', '🧘', { business: true }), apply('otherSpecialists')] },
    { key: 'psychology', icon: '🧠', kids: [leaf('psychologists', '🧠', { business: true }), leaf('psychotherapists', '🛋️', { business: true }), leaf('family', '👪', { business: true }), leaf('child', '🧸', { business: true }), leaf('teen', '🧑‍🎓', { business: true }), leaf('sexologists', '❤️', { business: true }), leaf('addiction', '🆘', { business: true }), leaf('sleep', '😴', { business: true }), leaf('stress', '🌿', { business: true }), apply('newDirection')] },
    { key: 'recovery', icon: '🦽', kids: [leaf('masseurs', '💆', { business: true }), leaf('injury', '🩹', { business: true }), leaf('speech', '🗣️', { business: true }), apply('newDirection')] },
    { key: 'motherChild', icon: '🤰', kids: [leaf('lactation', '🍼', { business: true }), leaf('birthPrep', '🤰', { business: true }), leaf('childMassage', '👶', { business: true }), leaf('childRehab', '🧒', { business: true }), leaf('childSpeech', '🗣️', { business: true }), apply('suggestDirection')] },
    leaf('shops', '🛍️', { business: true }),
  ],
  'helper-hour': [
    leaf('masters', '🧑‍🔧'),
    leaf('need', '📝'),
    leaf('rent', '🧰'),
    apply('cabinet', '🗂️'),
    apply('team', '👥'),
  ],
  translator: [
    { key: 'translators', icon: '🌐', kids: [leaf('english', '🇬🇧'), leaf('other', '🌍'), apply('newLanguage')] },
    leaf('documents', '📄'),
  ],
  turnkey: [
    { key: 'specialists', icon: '🧑‍💼', kids: [leaf('accounting', '🧮', { business: true }), leaf('legal', '⚖️', { business: true }), leaf('it', '💻', { business: true }), leaf('sales', '📈', { business: true }), leaf('hr', '🤝', { business: true }), leaf('logistics', '🚚', { business: true }), leaf('admin', '🗂️', { business: true }), apply('addService')] },
    leaf('partners', '🤝'),
    leaf('projects', '🧩'),
    leaf('export', '🚢'),
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
  invest: [
    leaf('projects', '📈', { derive: { investKind: 'project' } }),
    leaf('investors', '💰', { derive: { investKind: 'investor' } }),
    { key: 'specialists', icon: '🧑‍💼', kids: [leaf('analyst', '📊'), leaf('financial', '💹'), leaf('economist', '🧮'), leaf('auditor', '🔍'), leaf('marketer', '📣'), leaf('risk', '🛡️'), leaf('valuation', '🏷️'), apply('otherDirection')] },
  ],
  travel: [
    leaf('turnkey', '🧳', { business: true }),
    leaf('join', '👥'),
    leaf('pick', '🏖️'),
    { key: 'hot', icon: '🔥', kids: [leaf('cancelled', '↩️', { business: true }), leaf('prepaid', '🎟️', { business: true }), leaf('urgent', '⏱️', { business: true }), leaf('promo', '🏷️', { business: true }), leaf('lastSeats', '💺', { business: true })] },
    leaf('tickets', '🎫', { business: true }),
    leaf('insurance', '🛡️', { business: true }),
  ],
  pets: [
    { key: 'animals', icon: '🐶', kids: [{ key: 'dogs', icon: '🐕', kids: [leaf('list', '📋'), leaf('shop', '🛒', { business: true, directory: true })] }, { key: 'cats', icon: '🐈', kids: [leaf('list', '📋'), leaf('shop', '🛒', { business: true, directory: true })] }, { key: 'birds', icon: '🦜', kids: [leaf('list', '📋'), leaf('shop', '🛒', { business: true, directory: true })] }, { key: 'rodents', icon: '🐹', kids: [leaf('list', '📋'), leaf('shop', '🛒', { business: true, directory: true })] }, { key: 'fish', icon: '🐠', kids: [leaf('list', '📋'), leaf('shop', '🛒', { business: true, directory: true })] }, { key: 'reptiles', icon: '🦎', kids: [leaf('list', '📋'), leaf('shop', '🛒', { business: true, directory: true })] }, { key: 'farm', icon: '🐄', kids: [leaf('list', '📋'), leaf('shop', '🛒', { business: true, directory: true })] }, { key: 'other', icon: '🐾', kids: [leaf('list', '📋'), leaf('shop', '🛒', { business: true, directory: true })] }] },
    leaf('shops', '🛒', { business: true, directory: true }),
    leaf('vet', '🩺', { business: true }),
    leaf('training', '🎓', { business: true }),
    { key: 'grooming', icon: '✂️', kids: [leaf('shop', '🛒', { business: true }), leaf('learning', '🎓'), leaf('onsite', '🚗', { business: true })] },
    { key: 'sitting', icon: '🏠', kids: [leaf('need', '🙏'), leaf('can', '🤲'), leaf('hotels', '🏨', { business: true }), leaf('help', '🤝'), leaf('walking', '🦮')] },
    leaf('travel', '🧳'),
    leaf('nutrition', '🍖'),
    { key: 'club', icon: '🐾', href: '/clubs' },
    leaf('support', '❤️'),
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
    { key: 'all', icon: '🤝', href: '/clubs' },
    { key: 'fishing', icon: '🎣', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=fishing' }, leaf('shop', '🛒')] }, { key: 'hunting', icon: '🦌', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=hunting' }, leaf('shop', '🛒')] }, { key: 'knitting', icon: '🧶', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=knitting' }, leaf('shop', '🛒')] }, { key: 'creativity', icon: '🎨', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=creativity' }, leaf('shop', '🛒')] }, { key: 'travel', icon: '🧭', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=travel' }, leaf('shop', '🛒')] }, { key: 'sport', icon: '⚽', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=sport' }, leaf('shop', '🛒')] }, { key: 'auto', icon: '🚗', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=auto' }, leaf('shop', '🛒')] }, { key: 'business', icon: '💼', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=business' }, leaf('shop', '🛒')] }, { key: 'professional', icon: '🎓', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=professional' }, leaf('shop', '🛒')] }, { key: 'bloggers', icon: '📱', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=bloggers' }, leaf('shop', '🛒')] }, { key: 'streamers', icon: '🎥', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=streamers' }, leaf('shop', '🛒')] }, { key: 'gamers', icon: '🎮', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=gamers' }, leaf('shop', '🛒')] }, { key: 'other', icon: '✨', kids: [{ key: 'list', icon: '👥', href: '/clubs?category=other' }, leaf('shop', '🛒')] },
  ],
  trade: [
    leaf('producers', '🏭'),
    { key: 'organizers', icon: '🎪', kids: [leaf('self', '🎪'), leaf('member', '🤝')] },
  ],
};

export const PROJECT_FOLDERS: Record<string, ProjectFolder[]> = (() => {
  const out: Record<string, ProjectFolder[]> = {};
  Object.keys(SPECS).forEach((slug) => { out[slug] = build(slug, SPECS[slug], []); });
  // «Крамниця»: усі відділи ведуть до бізнес-кабінетів, а не до стрічки товарів
  const mark = (nodes: ProjectFolder[]) => nodes.forEach((n) => { if (n.sectionId) n.directory = true; if (n.children) mark(n.children); });
  mark(out['shops'] || []);
  return out;
})();

export function foldersFor(slug: string): ProjectFolder[] {
  return PROJECT_FOLDERS[slug] ?? [];
}

/** Знаходить папку за шляхом `a` або `a.b` (батьківська.дочірня). */
export function findFolder(slug: string, path: string | null): { folder: ProjectFolder; parent?: ProjectFolder } | null {
  if (!path) return null;
  const [a, b] = path.split('.');
  const top = foldersFor(slug).find((f) => f.key === a);
  if (!top) return null;
  if (!b) return { folder: top };
  const child = top.children?.find((c) => c.key === b);
  return child ? { folder: child, parent: top } : null;
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
