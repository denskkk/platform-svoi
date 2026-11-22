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
    { key: 'bodyType', type: 'select', options: ['sedan', 'hatchback', 'wagon', 'suv', 'crossover', 'minivan', 'coupe', 'pickup', 'other'], filter: 'select' },
    { key: 'carCondition', type: 'select', options: ['new', 'used'], filter: 'select' },
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'region', type: 'text', maxLength: 80, filter: 'text' },
    { key: 'carFeatures', type: 'text', maxLength: 300 },
    { key: 'carRentUnit', type: 'select', options: ['day', 'week', 'month'], filter: 'select' },
    { key: 'seats', type: 'number', min: 1, max: 60, filter: 'range' },
    { key: 'driverOption', type: 'select', options: ['without', 'with', 'both'], filter: 'select' },
    { key: 'deposit', type: 'text', maxLength: 80 },
    { key: 'pickupPlace', type: 'text', maxLength: 150 },
    { key: 'rentTerms', type: 'text', maxLength: 300 },
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
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'languages', type: 'text', maxLength: 120, filter: 'text' },
    { key: 'education', type: 'text', maxLength: 200 },
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
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'region', type: 'text', maxLength: 80, filter: 'text' },
    { key: 'shopAddress', type: 'text', maxLength: 150 },
    { key: 'workHours', type: 'text', maxLength: 100 },
    { key: 'producedGoods', type: 'text', maxLength: 250 },
    { key: 'routes', type: 'text', maxLength: 250 },
    { key: 'routeFrom', type: 'text', maxLength: 120 },
    { key: 'routeTo', type: 'text', maxLength: 120 },
    { key: 'cargoInfo', type: 'text', maxLength: 250 },
    { key: 'desiredDate', type: 'date' },
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
    { key: 'documents', type: 'text', maxLength: 300 },
    { key: 'offerType', type: 'select', options: ['sale', 'exchange', 'other'], filter: 'select' },
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'region', type: 'text', maxLength: 100, filter: 'text' },
    { key: 'shopAddress', type: 'text', maxLength: 200 },
    { key: 'workHours', type: 'text', maxLength: 150 },
    { key: 'languages', type: 'text', maxLength: 150 },
    { key: 'education', type: 'text', maxLength: 200 },
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
    { key: 'serviceFormat', type: 'select', options: ['online', 'offline', 'both'], filter: 'select' },
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
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'languages', type: 'text', maxLength: 120, filter: 'text' },
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
    { key: 'serviceFormat', type: 'select', options: ['online', 'offline', 'both'], filter: 'select' },
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
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'education', type: 'text', maxLength: 200 },
    { key: 'directions', type: 'text', maxLength: 200, filter: 'text' },
    { key: 'official', type: 'select', options: ['yes', 'no'], filter: 'select' },
  ],
  'invest': [
    { key: 'investKind', type: 'select', required: true, options: ['project', 'investor'], filter: 'select' },
    { key: 'amountNeeded', type: 'text', maxLength: 80 },
    { key: 'stage', type: 'text', maxLength: 100 },
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'industry', type: 'text', maxLength: 100, filter: 'text' },
    { key: 'amountUsd', type: 'number', min: 0, max: 1_000_000_000_000, filter: 'range' },
    { key: 'raisedUsd', type: 'number', min: 0, max: 1_000_000_000_000 },
    { key: 'searchStatus', type: 'select', options: ['open', 'partial', 'closed'], filter: 'select' },
    { key: 'contactPerson', type: 'text', maxLength: 100 },
    { key: 'investBudget', type: 'select', options: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'], filter: 'select' },
    { key: 'visibility', type: 'select', options: ['open', 'hidden'], filter: 'select' },
    { key: 'investFormats', type: 'text', maxLength: 200 },
    { key: 'interests', type: 'text', maxLength: 200, filter: 'text' },
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
    { key: 'serviceFormat', type: 'select', options: ['online', 'offline', 'both'], filter: 'select' },
  ],
  'travel': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'destination', type: 'text', required: true, maxLength: 120, filter: 'text' },
    { key: 'tripDate', type: 'date' },
    { key: 'fromCity', type: 'text', maxLength: 100, filter: 'text' },
    { key: 'tripDateEnd', type: 'date' },
    { key: 'hotelName', type: 'text', maxLength: 120 },
    { key: 'nights', type: 'number', min: 1, max: 365, filter: 'range' },
    { key: 'seatsFree', type: 'number', min: 0, max: 1000 },
    { key: 'oldPrice', type: 'number', min: 0, max: 100_000_000 },
    { key: 'included', type: 'text', maxLength: 300 },
    { key: 'extraCosts', type: 'text', maxLength: 200 },
    { key: 'validUntil', type: 'date' },
  ],
  'pets': [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'petCategory', type: 'text', required: true, maxLength: 100, filter: 'text' },
    { key: 'breed', type: 'text', maxLength: 80, filter: 'text' },
    { key: 'petAge', type: 'text', maxLength: 40 },
    { key: 'petGender', type: 'select', options: ['male', 'female'], filter: 'select' },
    { key: 'petAdType', type: 'select', options: ['owner', 'rehome', 'mate', 'other'], filter: 'select' },
    { key: 'petHealth', type: 'text', maxLength: 250 },
    { key: 'petTerms', type: 'text', maxLength: 250 },
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
    { key: 'languages', type: 'text', maxLength: 120, filter: 'text' },
    { key: 'education', type: 'text', maxLength: 200 },
    { key: 'serviceFormat', type: 'select', options: ['online', 'offline', 'both'], filter: 'select' },
    { key: 'petKind', type: 'text', maxLength: 100, filter: 'text' },
    { key: 'careFrom', type: 'date' },
    { key: 'careTo', type: 'date' },
    { key: 'capacity', type: 'text', maxLength: 100 },
    { key: 'petService', type: 'select', options: ['walk', 'nanny', 'feeding', 'visiting', 'individual', 'regular'], filter: 'select' },
    { key: 'routes', type: 'text', maxLength: 250 },
    { key: 'organizer', type: 'text', maxLength: 120 },
    { key: 'goalAmount', type: 'text', maxLength: 80 },
    { key: 'reportUrl', type: 'url', maxLength: 255 },
  ],
  clubs: [
    { key: 'adKind', type: 'select', required: true, options: ['offer', 'request'], filter: 'select' },
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'region', type: 'text', maxLength: 100, filter: 'text' },
    { key: 'eventDate', type: 'date' },
    { key: 'place', type: 'text', maxLength: 150 },
    { key: 'duration', type: 'text', maxLength: 100 },
    { key: 'serviceFormat', type: 'select', options: ['online', 'offline', 'both'], filter: 'select' },
    { key: 'certificateTerms', type: 'text', maxLength: 300 },
    { key: 'channelUrl', type: 'url', maxLength: 255 },
    { key: 'languages', type: 'text', maxLength: 150 },
    { key: 'education', type: 'text', maxLength: 200 },
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
  ],
  lawyers: [
    { key: 'consultFormat', type: 'select', options: ['online', 'offline', 'both'], filter: 'select' },
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
  ],
  'helper-hour': [
    { key: 'experience', type: 'number', min: 0, max: 70, filter: 'range' },
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'tools', type: 'text', maxLength: 200 },
    { key: 'availability', type: 'text', maxLength: 150 },
    { key: 'desiredDate', type: 'date' },
    { key: 'address', type: 'text', maxLength: 150 },
    { key: 'rentDeposit', type: 'text', maxLength: 100 },
    { key: 'deliveryOption', type: 'select', options: ['yes', 'no'], filter: 'select' },
    { key: 'techState', type: 'text', maxLength: 200 },
  ],
  jobs: [
    { key: 'jobKind', type: 'select', required: true, options: ['vacancy', 'resume', 'partner_search', 'cooperation'], filter: 'select' },
    { key: 'employment', type: 'select', options: ['full', 'part', 'remote', 'project'], filter: 'select' },
    { key: 'company', type: 'text', maxLength: 120 },
    { key: 'country', type: 'text', maxLength: 60, filter: 'text' },
    { key: 'region', type: 'text', maxLength: 80, filter: 'text' },
    { key: 'profession', type: 'text', maxLength: 100, filter: 'text' },
    { key: 'schedule', type: 'text', maxLength: 100, filter: 'text' },
    { key: 'hours', type: 'number', min: 1, max: 100, filter: 'range' },
    { key: 'jobExperience', type: 'number', min: 0, max: 60, filter: 'range' },
    { key: 'housing', type: 'select', options: ['yes', 'no'], filter: 'select' },
    { key: 'requirements', type: 'text', maxLength: 300 },
    { key: 'jobConditions', type: 'text', maxLength: 300 },
    { key: 'startWhen', type: 'text', maxLength: 80 },
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
const ids = (slug: string, prefix: string) => sectionLeaves(slug).map((l) => l.id).filter((id) => id.indexOf(prefix) === 0);
const JOB_SECTIONS = ['jobs_vacancies', 'jobs_apply_candidates'];
const SHOP_ABROAD = ['shops_abroad_stores', 'shops_abroad_warehouses'];
const SHOP_CARRIER = ['shops_delivery_fromUa', 'shops_delivery_europe'];
const TOUR_SECTIONS = ['travel_turnkey', 'travel_join'].concat(ids('travel', 'travel_hot_'));
const HEALTH_SPECIALISTS = ids('health', 'health_').filter((id) => id.indexOf('health_shops') !== 0);
const PET_ADS = sectionLeaves('pets').map((l) => l.id).filter((id) => /_list$/.test(id));
const PET_SPECIALISTS = ids('pets', 'pets_vet_').concat(ids('pets', 'pets_training_'), ids('pets', 'pets_nutrition_'), ['pets_grooming_learning', 'pets_grooming_onsite']);
const PET_CARE = ['pets_sitting_need', 'pets_sitting_can', 'pets_sitting_hotels', 'pets_sitting_help', 'pets_walking_need', 'pets_walking_can'];
const HH_RENT = ids('helper-hour', 'helper_hour_work_rent_');
const HH_JOB = ids('helper-hour', 'helper_hour_work_job_');
const HH_ALL = ids('helper-hour', 'helper_hour_');
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
    bodyType: { sections: CAR_SECTIONS }, country: { sections: CAR_SECTIONS }, region: { sections: CAR_SECTIONS }, carFeatures: { sections: CAR_SECTIONS },
    carCondition: { sections: ['cars_buy'] },
    carRentUnit: { sections: ['cars_rent'] }, seats: { sections: ['cars_rent'] }, driverOption: { sections: ['cars_rent'] },
    deposit: { sections: ['cars_rent'] }, pickupPlace: { sections: ['cars_rent'] }, rentTerms: { sections: ['cars_rent'] },
  },
  jobs: {
    jobKind: { derived: true },
    employment: { sections: JOB_SECTIONS }, company: { sections: ['jobs_vacancies'] },
    country: { sections: JOB_SECTIONS }, region: { sections: JOB_SECTIONS }, profession: { sections: JOB_SECTIONS },
    schedule: { sections: JOB_SECTIONS }, hours: { sections: ['jobs_vacancies'] }, jobExperience: { sections: JOB_SECTIONS },
    housing: { sections: ['jobs_vacancies'] }, requirements: { sections: ['jobs_vacancies'] }, jobConditions: { sections: ['jobs_vacancies'] },
    startWhen: { sections: ['jobs_apply_candidates'] },
  },
  invest: {
    investKind: { derived: true },
    country: { sections: ['invest_projects', 'invest_investors'].concat(ids('invest', 'invest_specialists_')) },
    industry: { sections: ['invest_projects'] }, amountUsd: { sections: ['invest_projects'] }, raisedUsd: { sections: ['invest_projects'] },
    searchStatus: { sections: ['invest_projects'] }, contactPerson: { sections: ['invest_projects'] }, stage: { sections: ['invest_projects'] }, amountNeeded: { sections: ['invest_projects'] },
    investBudget: { sections: ['invest_investors'], requiredIn: ['invest_investors'] }, visibility: { sections: ['invest_investors'], requiredIn: ['invest_investors'] },
    investFormats: { sections: ['invest_investors'] }, interests: { sections: ['invest_investors'] },
    experience: { sections: ids('invest', 'invest_specialists_') }, serviceFormat: { sections: ids('invest', 'invest_specialists_') },
  },
  health: {
    healthKind: { derived: true }, medSpecialty: { derived: true },
    consultFormat: { sections: HEALTH_SPECIALISTS }, experience: { sections: HEALTH_SPECIALISTS }, workplace: { sections: HEALTH_SPECIALISTS },
    country: { sections: HEALTH_SPECIALISTS }, languages: { sections: HEALTH_SPECIALISTS }, education: { sections: HEALTH_SPECIALISTS },
  },
  shops: {
    country: { sections: SHOP_ABROAD }, region: { sections: SHOP_ABROAD }, shopAddress: { sections: SHOP_ABROAD }, workHours: { sections: SHOP_ABROAD }, producedGoods: { sections: SHOP_ABROAD },
    routes: { sections: SHOP_CARRIER }, routeFrom: { sections: ['shops_delivery_request'] }, routeTo: { sections: ['shops_delivery_request'] },
    cargoInfo: { sections: ['shops_delivery_request'] }, desiredDate: { sections: ['shops_delivery_request'] },
  },
  turnkey: {
    adKind: { sections: ['turnkey_partners'] }, businessKind: { sections: ['turnkey_partners'] }, investment: { sections: [] },
    country: { sections: ['turnkey_partners'] },
    languages: { sections: ids('turnkey', 'turnkey_specialists_') }, experience: { sections: ids('turnkey', 'turnkey_specialists_') }, serviceFormat: { sections: ids('turnkey', 'turnkey_specialists_') },
  },
  translator: {
    adKind: { sections: [] }, languages: { sections: ids('translator', 'translator_translators_') }, serviceFormat: { sections: ids('translator', 'translator_translators_') },
    experience: { sections: ids('translator', 'translator_translators_') }, country: { sections: ids('translator', 'translator_translators_') },
    education: { sections: ids('translator', 'translator_translators_') }, directions: { sections: ids('translator', 'translator_translators_') }, official: { sections: ids('translator', 'translator_translators_') },
  },
  travel: {
    adKind: { sections: [] },
    destination: { sections: TOUR_SECTIONS }, tripDate: { sections: TOUR_SECTIONS }, tripDateEnd: { sections: TOUR_SECTIONS }, fromCity: { sections: TOUR_SECTIONS },
    hotelName: { sections: TOUR_SECTIONS }, nights: { sections: TOUR_SECTIONS }, included: { sections: TOUR_SECTIONS }, extraCosts: { sections: TOUR_SECTIONS },
    seatsFree: { sections: ['travel_join'].concat(ids('travel', 'travel_hot_')) }, oldPrice: { sections: ids('travel', 'travel_hot_') }, validUntil: { sections: ids('travel', 'travel_hot_') },
  },
  antiques: {
    adKind: { sections: ids('antiques', 'antiques_things_online'), requiredIn: ids('antiques', 'antiques_things_online') },
    era: { sections: ids('antiques', 'antiques_things_online') }, condition: { sections: ids('antiques', 'antiques_things_online') },
    documents: { sections: ids('antiques', 'antiques_things_online') }, offerType: { sections: ids('antiques', 'antiques_things_online') },
    country: { sections: ids('antiques', 'antiques_things_offline').concat(ids('antiques', 'antiques_experts'), ids('antiques', 'antiques_things_online')) },
    region: { sections: ids('antiques', 'antiques_things_offline').concat(ids('antiques', 'antiques_experts')) },
    shopAddress: { sections: ['antiques_things_offline'] }, workHours: { sections: ['antiques_things_offline'] },
    languages: { sections: ids('antiques', 'antiques_experts') }, education: { sections: ids('antiques', 'antiques_experts') },
    experience: { sections: ids('antiques', 'antiques_experts') }, serviceFormat: { sections: ids('antiques', 'antiques_experts') },
  },
  clubs: {
    adKind: { sections: ids('clubs', 'clubs_interest').filter((x) => /_(board|shop)$/.test(x)), requiredIn: ids('clubs', 'clubs_interest').filter((x) => /_(board|shop)$/.test(x)) },
    country: { sections: ids('clubs', 'clubs_interest').filter((x) => /_(board|events|experts)$/.test(x)) }, region: { sections: ids('clubs', 'clubs_interest').filter((x) => /_(board|events|experts)$/.test(x)) },
    eventDate: { sections: ids('clubs', 'clubs_interest').filter((x) => /_events$/.test(x)), requiredIn: ids('clubs', 'clubs_interest').filter((x) => /_events$/.test(x)) },
    place: { sections: ids('clubs', 'clubs_interest').filter((x) => /_events$/.test(x)) },
    duration: { sections: ids('clubs', 'clubs_interest').filter((x) => /_courses_/.test(x)) }, serviceFormat: { sections: ids('clubs', 'clubs_interest').filter((x) => /_(courses_|experts)/.test(x)) },
    certificateTerms: { sections: ids('clubs', 'clubs_interest').filter((x) => /_courses_certified$/.test(x)) },
    channelUrl: { sections: ids('clubs', 'clubs_interest').filter((x) => /_bloggers$/.test(x)) },
    languages: { sections: ids('clubs', 'clubs_interest').filter((x) => /_experts$/.test(x)) }, education: { sections: ids('clubs', 'clubs_interest').filter((x) => /_experts$/.test(x)) },
    experience: { sections: ids('clubs', 'clubs_interest').filter((x) => /_experts$/.test(x)) },
  },
  pets: {
    adKind: { sections: [] }, petCategory: { sections: [] },
    breed: { sections: PET_ADS }, petAge: { sections: PET_ADS }, petGender: { sections: PET_ADS }, petAdType: { sections: PET_ADS }, petHealth: { sections: PET_ADS }, petTerms: { sections: PET_ADS },
    country: { sections: PET_ADS.concat(PET_SPECIALISTS, PET_CARE, ['pets_travel_transport', 'pets_travel_hotels']) },
    experience: { sections: PET_SPECIALISTS.concat(PET_CARE) }, languages: { sections: PET_SPECIALISTS }, education: { sections: PET_SPECIALISTS }, serviceFormat: { sections: PET_SPECIALISTS },
    petKind: { sections: PET_CARE }, careFrom: { sections: PET_CARE }, careTo: { sections: PET_CARE }, capacity: { sections: PET_CARE }, petService: { sections: ['pets_walking_need', 'pets_walking_can'] },
    routes: { sections: ['pets_travel_transport'] },
    organizer: { sections: ids('pets', 'pets_support_') }, goalAmount: { sections: ids('pets', 'pets_support_') }, reportUrl: { sections: ids('pets', 'pets_support_') },
  },
  'helper-hour': {
    experience: { sections: HH_ALL }, country: { sections: HH_ALL },
    tools: { sections: ['helper_hour_work_job_find'] }, availability: { sections: ['helper_hour_work_job_find'] },
    desiredDate: { sections: ['helper_hour_work_job_need'] }, address: { sections: ['helper_hour_work_job_need'] },
    rentDeposit: { sections: HH_RENT }, deliveryOption: { sections: HH_RENT }, techState: { sections: HH_RENT },
  },
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
