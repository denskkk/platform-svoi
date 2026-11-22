/**
 * Конфігурація полів оголошень для кожного проєкту.
 * Додати новий напрямок = додати запис сюди (+ переклади `listings.fields.<project>.<key>`
 * та `listings.options.<key>.<value>`), без нових таблиць і нових API.
 * Модуль безпечний для імпорту і на клієнті, і на сервері (без залежностей).
 */

import { hasSections, sectionLeaves } from '@/lib/projectFolders';

export type FieldType = 'text' | 'number' | 'select' | 'url' | 'date';

export interface ListingField {
  key: string;
  type: FieldType;
  required?: boolean;
  /** Для number */
  min?: number;
  max?: number;
  /** Для select — допустимі значення (підписи в listings.options.<key>.<value>) */
  options?: string[];
  /** Для text */
  maxLength?: number;
  /** Як поле використовується у фільтрах каталогу */
  filter?: 'select' | 'range' | 'text';
  /** Поле стосується лише цих розділів (поле `section`); в інших воно приховане і не перевіряється */
  sections?: string[];
  /** Обов'язкове лише в цих розділах */
  requiredIn?: string[];
  /** Значення виставляється автоматично за розділом (див. derive в projectFolders): у формі не показується */
  derived?: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();

export const LISTING_FIELDS: Record<string, ListingField[]> = {
  cars: [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'sellerType', type: 'select', options: ['private', 'dealer'], filter: 'select' },
    { key: 'make', type: 'text', required: true, maxLength: 40, filter: 'text' },
    { key: 'model', type: 'text', required: true, maxLength: 60, filter: 'text' },
    { key: 'year', type: 'number', required: true, min: 1950, max: CURRENT_YEAR + 1, filter: 'range' },
    { key: 'mileage', type: 'number', min: 0, max: 2_000_000, filter: 'range' },
    { key: 'fuel', type: 'select', options: ['petrol', 'diesel', 'gas', 'hybrid', 'electric'], filter: 'select' },
    { key: 'engineVolume', type: 'number', min: 0.1, max: 12 },
    { key: 'transmission', type: 'select', options: ['manual', 'automatic', 'robot', 'variator'], filter: 'select' },
  ],
  'real-estate': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'propertyType', type: 'select', required: true, options: ['apartment', 'house', 'commercial', 'land', 'garage', 'newbuild', 'room', 'office'], filter: 'select' },
    { key: 'dealType', type: 'select', required: true, options: ['sale', 'rent'], filter: 'select' },
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'district', type: 'text', maxLength: 80, filter: 'text' },
    { key: 'rooms', type: 'number', min: 0, max: 50, filter: 'range' },
    { key: 'area', type: 'number', required: true, min: 1, max: 1_000_000, filter: 'range' },
    { key: 'address', type: 'text', maxLength: 150 },
    { key: 'features', type: 'text', maxLength: 250 },
    { key: 'rentPeriod', type: 'select', options: ['month', 'day'], filter: 'select' },
    { key: 'rentTerm', type: 'select', options: ['short', 'medium', 'long'], filter: 'select' },
    { key: 'rentConditions', type: 'text', maxLength: 300 },
    { key: 'homeCategory', type: 'select', options: ['furniture', 'appliances', 'electronics', 'kitchen', 'lighting', 'tools', 'dishes', 'textile', 'other'], filter: 'select' },
    { key: 'itemCondition', type: 'select', options: ['new', 'good', 'used', 'needs_repair'], filter: 'select' },
    { key: 'pickupTerms', type: 'text', maxLength: 250 },
    { key: 'moverService', type: 'select', options: ['loaders', 'disassembly', 'assembly', 'transport', 'full_move', 'removal'], filter: 'select' },
    { key: 'hasCar', type: 'select', options: ['yes', 'no'], filter: 'select' },
    { key: 'vehicleType', type: 'text', maxLength: 100 },
    { key: 'capacity', type: 'text', maxLength: 60 },
    { key: 'workers', type: 'number', min: 1, max: 500 },
  ],
  health: [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'healthKind', type: 'select', required: true, options: ['doctor', 'clinic', 'medical_center', 'online', 'dietitian', 'nutrition', 'rehab', 'other'], filter: 'select' },
    { key: 'medSpecialty', type: 'select', options: ['gynecologist', 'cardiologist', 'dentist', 'therapist', 'surgeon', 'other_med'], filter: 'select' },
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
    { key: 'workplace', type: 'text', maxLength: 120 },
    { key: 'consultFormat', type: 'select', options: ['online', 'offline', 'both'], filter: 'select' },
  ],
  sport: [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'sportKind', type: 'select', required: true, options: ['fitness', 'dance', 'martial_arts', 'yoga', 'swimming', 'team_sports', 'personal', 'online_training', 'other'], filter: 'select' },
    { key: 'trainingFormat', type: 'select', options: ['online', 'offline', 'both'], filter: 'select' },
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
  ],
  trade: [
    { key: 'tradeKind', type: 'select', required: true, options: ['manufacturer', 'supplier', 'goods', 'export', 'import', 'logistics', 'partner_search', 'wholesale'], filter: 'select' },
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'minOrder', type: 'text', maxLength: 80 },
    { key: 'deliveryTerms', type: 'text', maxLength: 150 },
  ],
  china: [
    { key: 'chinaKind', type: 'select', required: true, options: ['manufacturer', 'supplier', 'goods', 'logistics', 'wholesale'], filter: 'select' },
    { key: 'manufacturer', type: 'text', maxLength: 100, filter: 'text' },
    { key: 'minOrder', type: 'text', maxLength: 80 },
    { key: 'deliveryTerms', type: 'text', maxLength: 150 },
  ],
  services: [
    { key: 'specialty', type: 'text', required: true, maxLength: 100, filter: 'text' },
    { key: 'serviceFormat', type: 'select', options: ['online', 'offline', 'both'], filter: 'select' },
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
  ],
  shops: [
    { key: 'shopUrl', type: 'url', required: true, maxLength: 255 },
    { key: 'shopCategory', type: 'text', maxLength: 80, filter: 'text' },
    { key: 'popularProduct', type: 'text', maxLength: 120 },
    { key: 'benefits', type: 'text', maxLength: 200 },
    { key: 'partnerTerms', type: 'text', maxLength: 150 },
  ],
  events: [
    { key: 'eventKind', type: 'select', required: true, options: ['event', 'conference', 'exhibition', 'meetup', 'training', 'sport_event', 'culture'], filter: 'select' },
    { key: 'eventDate', type: 'date', required: true },
    { key: 'eventTime', type: 'text', maxLength: 20 },
    { key: 'place', type: 'text', maxLength: 150 },
    { key: 'organizer', type: 'text', maxLength: 120 },
    { key: 'registrationUrl', type: 'url', maxLength: 255 },
  ],
  'antiques': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'era', type: 'text', maxLength: 80, filter: 'text' },
    { key: 'condition', type: 'text', maxLength: 80 },
  ],
  'mystic': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'practice', type: 'text', required: true, maxLength: 100, filter: 'text' },
    { key: 'serviceFormat', type: 'select', options: ['online', 'offline', 'both'], filter: 'select' },
  ],
  'rebuild': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'direction', type: 'text', required: true, maxLength: 100, filter: 'text' },
    { key: 'region', type: 'text', maxLength: 100, filter: 'text' },
  ],
  'cooperatives': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'sphere', type: 'text', required: true, maxLength: 100, filter: 'text' },
  ],
  'grants': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'grantAmount', type: 'text', maxLength: 80 },
    { key: 'deadline', type: 'date' },
    { key: 'grantUrl', type: 'url', maxLength: 255 },
  ],
  'turnkey': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'businessKind', type: 'text', required: true, maxLength: 100, filter: 'text' },
    { key: 'investment', type: 'text', maxLength: 80 },
  ],
  'apps': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'platform', type: 'select', required: true, options: ['android', 'ios', 'web', 'other'], filter: 'select' },
    { key: 'appUrl', type: 'url', maxLength: 255 },
  ],
  'translator': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'languages', type: 'text', required: true, maxLength: 120, filter: 'text' },
    { key: 'serviceFormat', type: 'select', options: ['online', 'offline', 'both'], filter: 'select' },
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
  ],
  'invest': [
    { key: 'investKind', type: 'select', required: true, options: ['project', 'investor'], filter: 'select' },
    { key: 'amountNeeded', type: 'text', maxLength: 80 },
    { key: 'stage', type: 'text', maxLength: 100 },
  ],
  'travel': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'destination', type: 'text', required: true, maxLength: 120, filter: 'text' },
    { key: 'tripDate', type: 'date' },
  ],
  'pets': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'petCategory', type: 'text', required: true, maxLength: 100, filter: 'text' },
  ],
  clubs: [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
  ],
  lawyers: [
    { key: 'consultFormat', type: 'select', options: ['online', 'offline', 'both'], filter: 'select' },
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
  ],
  'helper-hour': [
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
  ],
  jobs: [
    { key: 'jobKind', type: 'select', required: true, options: ['vacancy', 'resume', 'partner_search', 'cooperation'], filter: 'select' },
    { key: 'employment', type: 'select', options: ['full', 'part', 'remote', 'project'], filter: 'select' },
    { key: 'company', type: 'text', maxLength: 120 },
  ],
};

/**
 * Проєкти з папками (projectFolders): оголошення завжди належить розділу (поле `section`, обов'язкове),
 * а решта полів стають необов'язковими й показуються лише там, де мають сенс (див. SECTION_RULES).
 */
const RE_BUY = ['real_estate_sale_apartments', 'real_estate_sale_houses', 'real_estate_sale_land', 'real_estate_sale_commercial', 'real_estate_sale_garages', 'real_estate_sale_newbuilds'];
const RE_RENT = ['real_estate_rent_apartments', 'real_estate_rent_houses', 'real_estate_rent_rooms', 'real_estate_rent_commercial', 'real_estate_rent_offices', 'real_estate_rent_garages', 'real_estate_rent_short'];
const RE_SECTIONS = RE_BUY.concat(RE_RENT);
const RE_HOME = ['real_estate_home_sell', 'real_estate_home_free', 'real_estate_home_moving'];
// Розділи, де має сенс кількість кімнат (не земля, гаражі, комерція й офіси)
const RE_ROOMS = ['real_estate_sale_apartments', 'real_estate_sale_houses', 'real_estate_sale_newbuilds', 'real_estate_rent_apartments', 'real_estate_rent_houses', 'real_estate_rent_rooms', 'real_estate_rent_short'];
const CAR_SECTIONS = ['cars_buy', 'cars_rent'];
const SECTION_RULES: Record<string, Record<string, Partial<ListingField>>> = {
  'real-estate': {
    // Тип об'єкта виставляється розділом (derive); обирає його сам користувач лише в короткостроковій оренді
    propertyType: { sections: ['real_estate_rent_short'], requiredIn: ['real_estate_rent_short'] },
    dealType: { sections: RE_SECTIONS, derived: true },
    country: { sections: RE_SECTIONS.concat(RE_HOME) },
    district: { sections: RE_SECTIONS.concat(RE_HOME) },
    rooms: { sections: RE_ROOMS },
    area: { sections: RE_SECTIONS, requiredIn: RE_SECTIONS },
    address: { sections: RE_SECTIONS },
    features: { sections: RE_SECTIONS },
    rentPeriod: { sections: RE_RENT },
    rentTerm: { sections: RE_RENT },
    rentConditions: { sections: RE_RENT },
    homeCategory: { sections: ['real_estate_home_sell', 'real_estate_home_free'] },
    itemCondition: { sections: ['real_estate_home_sell', 'real_estate_home_free'] },
    pickupTerms: { sections: ['real_estate_home_free'] },
    moverService: { sections: ['real_estate_home_moving'], requiredIn: ['real_estate_home_moving'] },
    hasCar: { sections: ['real_estate_home_moving'] },
    vehicleType: { sections: ['real_estate_home_moving'] },
    capacity: { sections: ['real_estate_home_moving'] },
    workers: { sections: ['real_estate_home_moving'] },
  },
  cars: {
    make: { sections: CAR_SECTIONS, requiredIn: CAR_SECTIONS },
    model: { sections: CAR_SECTIONS, requiredIn: CAR_SECTIONS },
    year: { sections: CAR_SECTIONS, requiredIn: CAR_SECTIONS },
    mileage: { sections: CAR_SECTIONS },
    fuel: { sections: CAR_SECTIONS },
    engineVolume: { sections: CAR_SECTIONS },
    transmission: { sections: CAR_SECTIONS },
    sellerType: { sections: CAR_SECTIONS },
  },
  jobs: { jobKind: { derived: true } },
  invest: { investKind: { derived: true } },
  health: { healthKind: { derived: true }, medSpecialty: { derived: true } },
};

Object.keys(LISTING_FIELDS).forEach((slug) => {
  if (!hasSections(slug)) return;
  const rules = SECTION_RULES[slug] ?? {};
  const ids = sectionLeaves(slug).map((l) => l.id);
  const relaxed: ListingField[] = LISTING_FIELDS[slug].map((f) => ({ ...f, required: false, ...(rules[f.key] ?? {}) }));
  LISTING_FIELDS[slug] = [{ key: 'section', type: 'select', required: true, options: ids, filter: 'select' } as ListingField].concat(relaxed);
});

export const CURRENCIES = ['UAH', 'USD', 'EUR'] as const;

export const LISTING_LIMITS = {
  titleMax: 150,
  descriptionMax: 5000,
  maxImages: 10,
  publishDays: 30,
  pageSize: 12,
  maxPageSize: 30,
  maxPendingPerUser: 10,
} as const;

export function hasListings(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(LISTING_FIELDS, slug);
}

export function fieldsFor(slug: string): ListingField[] {
  return hasListings(slug) ? LISTING_FIELDS[slug] : [];
}

/** Поля, які показуються у формі для обраного розділу (приховані й автоматичні не показуються). */
export function visibleFields(slug: string, section: string | null | undefined): ListingField[] {
  return fieldsFor(slug).filter((f) => !f.derived && (!f.sections || (!!section && f.sections.indexOf(section) !== -1)));
}

/** Чи обов'язкове поле в обраному розділі. */
export function isFieldRequired(f: ListingField, section: string | null | undefined): boolean {
  return !!f.required || (!!f.requiredIn && !!section && f.requiredIn.indexOf(section) !== -1);
}
