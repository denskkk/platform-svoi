/**
 * Централізована система перекладів для платформи "СВІЙ ДЛЯ СВОЇХ"
 * Переклади enum значень, категорій, статусів тощо беруться з messages/{locale}/enums.json.
 * Усі функції приймають необов'язковий `locale` (за замовчуванням 'uk') і працюють і на клієнті, і на сервері.
 */

import { defaultLocale, intlLocales, type Locale } from '@/i18n/config'
import { enumGroup, enumString, resolveCategorySlug, getCategoryName } from './constants'

type Value = string | null | undefined

const makeTranslator = (group: string) => (value: Value, locale: Locale = defaultLocale): string => {
  if (!value) return ''
  return enumString(group, value, locale) ?? value
}

// Стать
export const translateGender = makeTranslator('gender')

// Сімейний стан
export const translateMaritalStatus = makeTranslator('maritalStatus')

// Освіта
export const translateEducation = makeTranslator('education')

// Статус зайнятості
export const translateEmploymentStatus = makeTranslator('employmentStatus')

// Тип акаунту
export const translateAccountType = makeTranslator('accountType')

// Статус заявки
export const translateServiceRequestStatus = makeTranslator('serviceRequestStatus')

const legacyCategoryKeysByUkName: Record<string, string> = Object.fromEntries(
  Object.entries(enumGroup('category', 'uk')).map(([key, label]) => [String(label).trim().toLowerCase(), key]),
)

// Категорії бізнесу/послуг: приймає ключ, slug категорії або українську назву
export const translateCategory = (category: Value, locale: Locale = defaultLocale): string => {
  if (!category) return ''
  const legacy = enumString('category', category, locale)
  if (legacy) return legacy
  if (resolveCategorySlug(category)) return getCategoryName(category, locale)
  const legacyKey = legacyCategoryKeysByUkName[category.trim().toLowerCase()]
  return (legacyKey && enumString('category', legacyKey, locale)) || category
}

// Тип пропозиції
export const translateOfferType = makeTranslator('offerType')

// Тип зайнятості
export const translateEmploymentType = makeTranslator('employmentType')

// Тип компанії
export const translateCompanyType = makeTranslator('companyType')

// Так/Ні
export const translateBoolean = (value: boolean | null | undefined, locale: Locale = defaultLocale): string => {
  if (value === null || value === undefined) return ''
  return enumString('boolean', value ? 'yes' : 'no', locale) ?? (value ? 'Yes' : 'No')
}

// Тип житла
export const translateHousingType = makeTranslator('housingType')

// Проживання
export const translateLivingSituation = makeTranslator('livingSituation')

// Статус транзакції
export const translateTransactionStatus = makeTranslator('transactionStatus')

// Роль користувача
export const translateRole = makeTranslator('role')

// Дозволи
export const translatePermission = makeTranslator('permission')

// Список як рядок
export const formatList = (items: any[] | string | null | undefined, separator = ', '): string => {
  if (!items) return '';
  if (typeof items === 'string') {
    return items;
  }
  if (Array.isArray(items)) {
    return items.filter(Boolean).join(separator);
  }
  return String(items);
};

// Форматування дати
export const formatDate = (
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale: Locale = defaultLocale
): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  return d.toLocaleDateString(intlLocales[locale], defaultOptions);
};

// Форматування дати та часу
export const formatDateTime = (date: string | Date | null | undefined, locale: Locale = defaultLocale): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(intlLocales[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Форматування гривень
export const formatUAH = (amount: number | null | undefined, locale: Locale = defaultLocale): string => {
  const value = amount ?? 0;
  if (locale === 'uk') return `${value.toLocaleString('uk-UA')} ₴`;
  return `₴${value.toLocaleString(intlLocales[locale])}`;
};
