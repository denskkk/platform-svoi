export const locales = ['uk', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'uk'

/** Persistent, JS-readable cookie that stores the user's explicit language choice. */
export const LOCALE_COOKIE = 'sviy_locale'
/** Request header set by middleware so server components know the resolved locale. */
export const LOCALE_HEADER = 'x-sviy-locale'
/** Request header with the locale-less pathname, used to build canonical/hreflang metadata. */
export const PATH_HEADER = 'x-sviy-path'
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const intlLocales: Record<Locale, string> = {
  uk: 'uk-UA',
  en: 'en-GB',
}

export const localeLabels: Record<Locale, string> = {
  uk: 'Українська',
  en: 'English',
}

export const ogLocales: Record<Locale, string> = {
  uk: 'uk_UA',
  en: 'en_US',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

/**
 * Picks the first supported language (by q-weight) from an Accept-Language header.
 * Returns null when none of the listed languages is supported.
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null
  const ranked = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const qParam = params.find((p) => p.trim().startsWith('q='))
      const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0, index }
    })
    .filter((item) => item.tag && item.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)

  for (const { tag } of ranked) {
    const primary = tag.split('-')[0]
    if (isLocale(primary)) return primary
  }
  return null
}

export function readCookie(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null
  for (const chunk of cookieHeader.split(';')) {
    const eq = chunk.indexOf('=')
    if (eq === -1) continue
    if (chunk.slice(0, eq).trim() === name) {
      try {
        return decodeURIComponent(chunk.slice(eq + 1).trim())
      } catch {
        return null
      }
    }
  }
  return null
}

/** Resolves the locale for a raw request: explicit cookie -> Accept-Language -> default. */
export function resolveLocale(cookieHeader: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
  const fromCookie = readCookie(cookieHeader, LOCALE_COOKIE)
  if (isLocale(fromCookie)) return fromCookie
  return parseAcceptLanguage(acceptLanguage) ?? defaultLocale
}
