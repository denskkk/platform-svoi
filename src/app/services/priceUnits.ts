import type { Translator } from '@/i18n/translate';

// Stored values are saved to the DB as-is; only the displayed label is translated.
export const PRICE_UNIT_VALUES = ['грн', 'грн/год', 'грн/день', 'грн/м²', 'договірна'] as const; // i18n-ignore

const PRICE_UNIT_KEYS: Record<string, string> = {
  'грн': 'uah', // i18n-ignore
  'грн/год': 'perHour', // i18n-ignore
  'грн/день': 'perDay', // i18n-ignore
  'грн/м²': 'perM2', // i18n-ignore
  'договірна': 'negotiable', // i18n-ignore
};

export function priceUnitLabel(unit: string | null | undefined, t: Translator): string {
  const key = PRICE_UNIT_KEYS[unit || 'грн']; // i18n-ignore
  return key ? t(`services.units.${key}`) : (unit as string);
}
