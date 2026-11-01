import { headers, cookies } from 'next/headers'
import { Locale, LOCALE_COOKIE, LOCALE_HEADER, defaultLocale, isLocale, resolveLocale, intlLocales } from './config'
import { getMessages } from './messages'
import { createTranslator, Translator } from './translate'

export function createT(locale: Locale): Translator {
  const other: Locale = locale === 'uk' ? 'en' : 'uk'
  return createTranslator(locale, getMessages(locale), getMessages(other))
}

/** Locale of the current request in a Server Component / route handler (set by middleware). */
export function getLocale(): Locale {
  try {
    const fromHeader = headers().get(LOCALE_HEADER)
    if (isLocale(fromHeader)) return fromHeader
    const fromCookie = cookies().get(LOCALE_COOKIE)?.value
    if (isLocale(fromCookie)) return fromCookie
  } catch {
    // Outside of a request scope (e.g. build time) – fall back to the default locale.
  }
  return defaultLocale
}

/** Server-side translator for the current request. */
export function getT(): { t: Translator; locale: Locale } {
  const locale = getLocale()
  return { t: createT(locale), locale }
}

/** Locale for an API request: middleware header, cookie, Accept-Language, then default. */
export function getRequestLocale(req: Request): Locale {
  const fromHeader = req.headers.get(LOCALE_HEADER)
  if (isLocale(fromHeader)) return fromHeader
  return resolveLocale(req.headers.get('cookie'), req.headers.get('accept-language'))
}

/** Translator for user-visible API messages (`api.*` keys). */
export function getApiT(req: Request): Translator {
  return createT(getRequestLocale(req))
}

export function formatDateForLocale(value: Date | string | number, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocales[locale], options ?? { dateStyle: 'medium' }).format(new Date(value))
}
