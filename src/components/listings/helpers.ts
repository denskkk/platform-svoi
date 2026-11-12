import { fieldsFor } from '@/lib/listingFields';

type T = (key: string, params?: Record<string, string | number>) => string;

export interface ListingCardData {
  id: number;
  projectSlug: string;
  title: string;
  price: number | null;
  currency: string;
  city: string | null;
  createdAt: string;
  thumb: string | null;
  status: string;
  isOwner: boolean;
  saved: boolean;
  data: Record<string, string | number>;
}

export function formatPrice(price: number | null, currency: string, locale: string, t: T): string {
  if (price === null || price === undefined) return t('listings.common.noPrice');
  const n = new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en', { maximumFractionDigits: 2 }).format(price);
  const label = t(`listings.currencies.${currency}`);
  return currency === 'UAH' ? `${n} ${label}` : `${label}${n}`;
}

/** Підпис значення поля: для select — переклад варіанта, для решти — саме значення. */
export function fieldValueLabel(key: string, value: string | number, type: string, t: T): string {
  return type === 'select' ? t(`listings.options.${key}.${value}`) : String(value);
}

/** Короткий рядок характеристик для картки каталогу. */
export function specSummary(slug: string, data: Record<string, string | number>, t: T): string[] {
  const parts: string[] = [];
  const get = (k: string) => data?.[k];
  if (slug === 'cars') {
    if (get('year')) parts.push(String(get('year')));
    if (get('mileage') !== undefined) parts.push(`${new Intl.NumberFormat('en').format(Number(get('mileage')))} ${t('listings.common.kmUnit')}`);
    if (get('fuel')) parts.push(t(`listings.options.fuel.${get('fuel')}`));
  } else if (slug === 'real-estate') {
    if (get('propertyType')) parts.push(t(`listings.options.propertyType.${get('propertyType')}`));
    if (get('rooms') !== undefined) parts.push(`${get('rooms')} ${t('listings.common.roomsShort')}`);
    if (get('area')) parts.push(`${get('area')} ${t('listings.common.areaUnit')}`);
  }
  return parts;
}

export function detailRows(slug: string, data: Record<string, string | number>, t: T): { label: string; value: string }[] {
  return fieldsFor(slug)
    .filter((f) => data?.[f.key] !== undefined && data?.[f.key] !== '')
    .map((f) => ({ label: t(`listings.fields.${slug}.${f.key}`), value: fieldValueLabel(f.key, data[f.key], f.type, t) }));
}
