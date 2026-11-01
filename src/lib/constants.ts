import { defaultLocale, type Locale } from '@/i18n/config'
import { getMessages } from '@/i18n/messages'

// Категорії послуг
export const categories = [
  { id: 1, name: 'Все для дому', slug: 'vse-dlya-domu', description: 'Ремонт, прибирання, майстри', emoji: '🏠' }, // i18n-ignore
  { id: 2, name: 'Все для Авто', slug: 'vse-dlya-auto', description: 'Авто, мото, велосипеди, самокати', emoji: '🚗' }, // i18n-ignore
  { id: 3, name: 'Краса', slug: 'krasa', description: 'Салони, перукарі, косметологи', emoji: '💅' }, // i18n-ignore
  { id: 4, name: 'Освіта', slug: 'osvita', description: 'Курси, репетитори, навчання', emoji: '📚' }, // i18n-ignore
  { id: 5, name: 'Розваги та хоббі', slug: 'rozvagy-ta-hobbi', description: 'Спорт, дозвілля, творчість', emoji: '🎨' }, // i18n-ignore
  { id: 6, name: 'Все для дітей', slug: 'vse-dlya-ditey', description: 'Садочки, секції, іграшки', emoji: '👶' }, // i18n-ignore
  { id: 7, name: 'Магазини онлайн', slug: 'magazyny-online', description: 'Інтернет-магазини', emoji: '🛒' }, // i18n-ignore
  { id: 8, name: 'Магазини офлайн', slug: 'magazyny-offline', description: 'Фізичні магазини', emoji: '🏪' }, // i18n-ignore
  { id: 9, name: 'Все для домашніх тварин', slug: 'vse-dlya-tvaryn', description: 'Ветеринари, зоомагазини', emoji: '🐾' }, // i18n-ignore
  { id: 10, name: 'Ресторани, готелі', slug: 'restorany-goteli', description: 'HoReCa, кейтеринг', emoji: '🍽️' }, // i18n-ignore
  { id: 11, name: 'Агенство з продажу Нерухомості', slug: 'neruhomist', description: 'Продаж, оренда житла', emoji: '🏢' }, // i18n-ignore
  { id: 12, name: 'Агенство з продажу Рухомого майна', slug: 'ruhome-mayno', description: 'Авто, техніка, обладнання', emoji: '🚛' }, // i18n-ignore
  { id: 13, name: 'Заявки на виконання задач онлайн та офлайн', slug: 'zayavky-na-zadachi', description: 'Онлайн та офлайн послуги', emoji: '✅' }, // i18n-ignore
  { id: 14, name: 'Дошка подій та оголошень', slug: 'podiyi-ta-ogoloshennya', description: 'Події, новини, оголошення', emoji: '📢' }, // i18n-ignore
  { id: 15, name: 'Все для обслуговування та розвитку вашого бізнесу', slug: 'vse-dlya-biznesu', description: 'B2B послуги для бізнесу', emoji: '💼' }, // i18n-ignore
] as const

// Типи акаунтів
export const accountTypes = [
  {
    id: 'individual',
    title: 'Звичайний профіль', // i18n-ignore
    icon: '👤',
    description: 'Я хочу пропонувати свої послуги', // i18n-ignore
  },
  {
    id: 'business',
    title: 'Бізнес-профіль', // i18n-ignore
    icon: '🏢',
    description: 'Маю власну справу чи компанію', // i18n-ignore
  },
  {
    id: 'viewer',
    title: 'Глядач', // i18n-ignore
    icon: '👀',
    description: 'Просто хочу переглядати', // i18n-ignore
  },
] as const

// Міста України
export const cities = [
  'Київ', // i18n-ignore
  'Харків', // i18n-ignore
  'Одеса', // i18n-ignore
  'Дніпро', // i18n-ignore
  'Донецьк', // i18n-ignore
  'Запоріжжя', // i18n-ignore
  'Львів', // i18n-ignore
  'Кривий Ріг', // i18n-ignore
  'Миколаїв', // i18n-ignore
  'Маріуполь', // i18n-ignore
  'Луганськ', // i18n-ignore
  'Вінниця', // i18n-ignore
  'Херсон', // i18n-ignore
  'Полтава', // i18n-ignore
  'Чернігів', // i18n-ignore
  'Черкаси', // i18n-ignore
  'Суми', // i18n-ignore
  'Житомир', // i18n-ignore
  'Хмельницький', // i18n-ignore
  'Рівне', // i18n-ignore
  'Чернівці', // i18n-ignore
  'Тернопіль', // i18n-ignore
  'Івано-Франківськ', // i18n-ignore
  'Луцьк', // i18n-ignore
  'Ужгород', // i18n-ignore
] as const

// Типи користувачів
export type UserType = 'individual' | 'business' | 'viewer'
export type CategoryId = typeof categories[number]['id']

type EnumGroups = Record<string, Record<string, unknown>>

/** Reads a localized enum group straight from the message files (safe for client and server code). */
export function enumGroup(group: string, locale: Locale = defaultLocale): Record<string, unknown> {
  const enums = getMessages(locale).enums as unknown as EnumGroups | undefined
  return enums?.[group] ?? {}
}

export function enumString(group: string, key: string, locale: Locale = defaultLocale): string | undefined {
  const bucket = enumGroup(group, locale)
  if (!Object.prototype.hasOwnProperty.call(bucket, key)) return undefined
  const value = bucket[key]
  return typeof value === 'string' ? value : undefined
}

const normalize = (value: string) => value.trim().toLowerCase()

const cityKeys: Record<string, string> = {
  'Київ': 'kyiv', // i18n-ignore
  'Харків': 'kharkiv', // i18n-ignore
  'Одеса': 'odesa', // i18n-ignore
  'Дніпро': 'dnipro', // i18n-ignore
  'Донецьк': 'donetsk', // i18n-ignore
  'Запоріжжя': 'zaporizhzhia', // i18n-ignore
  'Львів': 'lviv', // i18n-ignore
  'Кривий Ріг': 'kryvyi_rih', // i18n-ignore
  'Миколаїв': 'mykolaiv', // i18n-ignore
  'Маріуполь': 'mariupol', // i18n-ignore
  'Луганськ': 'luhansk', // i18n-ignore
  'Вінниця': 'vinnytsia', // i18n-ignore
  'Херсон': 'kherson', // i18n-ignore
  'Полтава': 'poltava', // i18n-ignore
  'Чернігів': 'chernihiv', // i18n-ignore
  'Черкаси': 'cherkasy', // i18n-ignore
  'Суми': 'sumy', // i18n-ignore
  'Житомир': 'zhytomyr', // i18n-ignore
  'Хмельницький': 'khmelnytskyi', // i18n-ignore
  'Рівне': 'rivne', // i18n-ignore
  'Чернівці': 'chernivtsi', // i18n-ignore
  'Тернопіль': 'ternopil', // i18n-ignore
  'Івано-Франківськ': 'ivano_frankivsk', // i18n-ignore
  'Луцьк': 'lutsk', // i18n-ignore
  'Ужгород': 'uzhhorod', // i18n-ignore
}

const cityKeysByNormalized: Record<string, string> = Object.fromEntries(
  Object.entries(cityKeys).map(([name, key]) => [normalize(name), key]),
)

/** Display name of a city; stored values stay Ukrainian. Unknown values are returned unchanged. */
export function getCityName(ukCityName: string | null | undefined, locale: Locale = defaultLocale): string {
  if (!ukCityName) return ''
  if (locale === 'uk') return ukCityName
  const key = cityKeysByNormalized[normalize(ukCityName)]
  return (key && enumString('cities', key, locale)) || ukCityName
}

const categorySlugs: Record<string, string> = Object.fromEntries(
  Object.entries(enumGroup('categories', 'uk')).flatMap(([slug, entry]) => [
    [normalize((entry as { name: string }).name), slug],
    [normalize(slug), slug],
  ]),
)

export function resolveCategorySlug(categoryOrSlugOrName: string | { slug?: string | null; name?: string | null } | null | undefined): string | null {
  if (!categoryOrSlugOrName) return null
  if (typeof categoryOrSlugOrName === 'string') return categorySlugs[normalize(categoryOrSlugOrName)] ?? null
  const { slug, name } = categoryOrSlugOrName
  return (slug && categorySlugs[normalize(slug)]) || (name && categorySlugs[normalize(name)]) || null
}

type CategoryRef = string | { slug?: string | null; name?: string | null } | null | undefined

export function getCategoryName(categoryOrSlugOrName: CategoryRef, locale: Locale = defaultLocale): string {
  const slug = resolveCategorySlug(categoryOrSlugOrName)
  const fallback = typeof categoryOrSlugOrName === 'string' ? categoryOrSlugOrName : categoryOrSlugOrName?.name ?? categoryOrSlugOrName?.slug ?? ''
  if (!slug) return fallback
  const entry = enumGroup('categories', locale)[slug] as { name?: string } | undefined
  return entry?.name ?? fallback
}

export function getCategoryDescription(slugOrName: CategoryRef, locale: Locale = defaultLocale): string {
  const slug = resolveCategorySlug(slugOrName)
  if (!slug) return ''
  const entry = enumGroup('categories', locale)[slug] as { description?: string } | undefined
  return entry?.description ?? categories.find((c) => c.slug === slug)?.description ?? ''
}

export interface LocalizedAccountType {
  id: UserType
  icon: string
  title: string
  description: string
}

export function getAccountTypes(locale: Locale = defaultLocale): LocalizedAccountType[] {
  const localized = enumGroup('accountTypes', locale) as Record<string, { title?: string; description?: string }>
  return accountTypes.map((type) => ({
    id: type.id,
    icon: type.icon,
    title: localized[type.id]?.title ?? type.title,
    description: localized[type.id]?.description ?? type.description,
  }))
}
