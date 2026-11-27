/**
 * Пошук напрямів і папок проєктів за словами запиту («квартира купити», «house», «оренда авто»…).
 * Дані — ключові слова для пошуку (укр/рос/англ), не UI-текст. Кожен запис веде у проєкт
 * або одразу в потрібну папку (`?folder=` шлях у projectFolders.ts).
 */

export interface DirectionHit { slug: string; folder?: string; labelKey: string }

interface Entry { slug: string; folder?: string; stems: string[]; labelKey: string }

// Порядок важливий: конкретніші папки йдуть раніше за загальні проєкти
const ENTRIES: Entry[] = [
  // i18n-ignore: ключові слова пошуку
  { slug: 'real-estate', folder: 'sale.apartments', labelKey: 'search.hits.apartmentsSale', stems: ['квартир', 'flat', 'apartment', 'кімнат', 'вторинк', 'новобуд'] }, // i18n-ignore
  { slug: 'real-estate', folder: 'sale.houses', labelKey: 'search.hits.housesSale', stems: ['будинок', 'будинк', 'дом ', 'house', 'котедж', 'cottage', 'таунхаус', 'townhouse', 'ділянк', 'земл', 'участок', 'land', 'plot'] }, // i18n-ignore
  { slug: 'real-estate', folder: 'sale.garages', labelKey: 'search.hits.garages', stems: ['гараж', 'garage', 'паркомісц', 'парковк', 'parking'] }, // i18n-ignore
  { slug: 'real-estate', folder: 'sale.commercial', labelKey: 'search.hits.commercial', stems: ['комерц', 'commercial', 'офіс', 'office', 'склад', 'магазин прим'] }, // i18n-ignore
  { slug: 'real-estate', folder: 'rent', labelKey: 'search.hits.rent', stems: ['орендa', 'оренд', 'зняти', 'аренд', 'снять', 'rent', 'lease'] }, // i18n-ignore
  { slug: 'real-estate', labelKey: 'search.hits.realEstate', stems: ['нерухом', 'недвиж', 'real estate', 'property', 'realtor', 'ріелт', 'риелт', 'купити житл', 'продати житл', 'житло', 'housing'] }, // i18n-ignore
  { slug: 'helper-hour', labelKey: 'search.hits.helperHour', stems: ['майстр', 'мастер', 'помічник', 'помощник', 'на годину', 'на час', 'handyman', 'сантехнік', 'електрик', 'plumber', 'electrician', 'підробіт', 'виконую роб'] }, // i18n-ignore
  { slug: 'taxi', labelKey: 'search.hits.taxi', stems: ['таксі', 'такси', 'taxi', 'водій', 'водитель', 'driver', 'трансфер'] }, // i18n-ignore
  { slug: 'beauty', labelKey: 'search.hits.beauty', stems: ['краса', 'beauty', 'манікюр', 'перукар', 'барбер', 'косметолог', 'салон'] }, // i18n-ignore
  { slug: 'export-alliance', labelKey: 'search.hits.export', stems: ['експорт', 'экспорт', 'export', 'аграр', 'зерно', 'фермер', 'agro'] }, // i18n-ignore
  { slug: 'lawyers', labelKey: 'search.hits.lawyers', stems: ['юрист', 'адвокат', 'lawyer', 'attorney', 'нотаріус', 'legal'] }, // i18n-ignore
  { slug: 'china', labelKey: 'search.hits.china', stems: ['китай', 'china', 'закупівл', 'закупк'] }, // i18n-ignore
  { slug: 'cars', labelKey: 'search.hits.cars', stems: ['авто', 'машин', 'car ', 'cars', 'vehicle'] }, // i18n-ignore
  { slug: 'antiques', labelKey: 'search.hits.antiques', stems: ['антикв', 'antique', 'колекц', 'collect'] }, // i18n-ignore
  { slug: 'clubs', labelKey: 'search.hits.clubs', stems: ['клуб', 'club', 'риболов', 'полюван', 'fishing', 'hunting'] }, // i18n-ignore
  { slug: 'shops', labelKey: 'search.hits.shops', stems: ['крамниц', 'магазин', 'shop', 'store', 'товар'] }, // i18n-ignore
];

/** Повертає до 4 підходящих напрямів/папок для запиту (порожньо, якщо збігів нема). */
export function matchDirections(query: string): DirectionHit[] {
  const q = ` ${query.toLowerCase().trim()} `;
  if (q.trim().length < 3) return [];
  const hits: DirectionHit[] = [];
  const seen = new Set<string>();
  const hasRent = /оренд|аренд|rent|зняти|снять/.test(q);
  for (const e of ENTRIES) {
    if (!e.stems.some((s) => q.includes(s.trim() === s ? s : s))) continue;
    let folder = e.folder;
    // «квартира оренда» → оренда квартир, а не купівля
    if (e.slug === 'real-estate' && folder?.startsWith('sale.') && hasRent) folder = folder.replace('sale.', 'rent.');
    const key = `${e.slug}:${folder ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ slug: e.slug, folder, labelKey: e.labelKey });
    if (hits.length >= 4) break;
  }
  // Загальна «оренда» без типу: не дублюємо «rent» разом із rent.* варіантами
  return hits.filter((h) => !(h.folder === 'rent' && hits.some((o) => o !== h && o.folder?.startsWith('rent.'))));
}

export const directionHref = (h: DirectionHit) => `/projects/${h.slug}${h.folder ? `?folder=${h.folder}` : ''}`;
