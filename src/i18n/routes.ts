import { Locale, defaultLocale, isLocale } from './config'

/** Pages that exist under a dedicated `/en/...` URL (public, indexable, shared with Google Play). */
export const PUBLIC_LOCALIZED_PATHS = [
  '/',
  '/about',
  '/privacy',
  '/terms-of-use',
  '/account-deletion',
  '/support',
  '/contacts',
] as const

export function normalizePath(path: string): string {
  if (!path || path === '/') return '/'
  const trimmed = path.replace(/\/+$/, '')
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function isPublicLocalizedPath(path: string): boolean {
  return (PUBLIC_LOCALIZED_PATHS as readonly string[]).includes(normalizePath(path))
}

/** Splits `/en/about` into `{ locale: 'en', path: '/about' }`. `/uk/...` is treated as a legacy prefix too. */
export function splitLocalePrefix(pathname: string): { locale: Locale | null; path: string } {
  const match = pathname.match(/^\/([a-z]{2})(\/.*)?$/)
  if (match && isLocale(match[1])) {
    return { locale: match[1], path: match[2] || '/' }
  }
  return { locale: null, path: pathname || '/' }
}

/** Builds the canonical URL path of a page for a locale (only public pages get an `/en` prefix). */
export function localizedPath(path: string, locale: Locale): string {
  const normalized = normalizePath(path.split(/[?#]/)[0])
  if (locale === defaultLocale || !isPublicLocalizedPath(normalized)) return path
  const suffix = path.slice(path.split(/[?#]/)[0].length)
  return `${normalized === '/' ? '/en' : `/en${normalized}`}${suffix}`
}

/** Path to navigate to when the user switches language on the given (possibly prefixed) path. */
export function switchLocalePath(currentPathname: string, target: Locale): string {
  const { path } = splitLocalePrefix(currentPathname)
  return localizedPath(path, target)
}

export const PRIVATE_PATH_PREFIXES = [
  '/admin',
  '/auth',
  '/chat',
  '/favorites',
  '/feed',
  '/profile/edit',
  '/profile/edit-business',
  '/service-requests',
  '/services/create',
  '/reviews',
  '/requests',
  '/public-requests/create',
  '/api',
]

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}
