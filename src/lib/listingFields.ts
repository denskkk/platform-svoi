/**
 * Конфігурація полів оголошень для кожного проєкту.
 * Додати новий напрямок = додати запис сюди (+ переклади `listings.fields.<project>.<key>`
 * та `listings.options.<key>.<value>`), без нових таблиць і нових API.
 * Модуль безпечний для імпорту і на клієнті, і на сервері (без залежностей).
 */

export type FieldType = 'text' | 'number' | 'select';

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
}

const CURRENT_YEAR = new Date().getFullYear();

export const LISTING_FIELDS: Record<string, ListingField[]> = {
  cars: [
    { key: 'make', type: 'text', required: true, maxLength: 40, filter: 'text' },
    { key: 'model', type: 'text', required: true, maxLength: 60, filter: 'text' },
    { key: 'year', type: 'number', required: true, min: 1950, max: CURRENT_YEAR + 1, filter: 'range' },
    { key: 'mileage', type: 'number', min: 0, max: 2_000_000, filter: 'range' },
    { key: 'fuel', type: 'select', options: ['petrol', 'diesel', 'gas', 'hybrid', 'electric'], filter: 'select' },
    { key: 'engineVolume', type: 'number', min: 0.1, max: 12 },
    { key: 'transmission', type: 'select', options: ['manual', 'automatic', 'robot', 'variator'], filter: 'select' },
  ],
  'real-estate': [
    { key: 'propertyType', type: 'select', required: true, options: ['apartment', 'house', 'commercial', 'land'], filter: 'select' },
    { key: 'dealType', type: 'select', required: true, options: ['sale', 'rent'], filter: 'select' },
    { key: 'rooms', type: 'number', min: 0, max: 50, filter: 'range' },
    { key: 'area', type: 'number', required: true, min: 1, max: 1_000_000, filter: 'range' },
    { key: 'address', type: 'text', maxLength: 150 },
  ],
};

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
