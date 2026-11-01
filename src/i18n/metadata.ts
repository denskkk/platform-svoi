import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { PATH_HEADER, Locale, locales, ogLocales } from './config'
import { isPrivatePath, isPublicLocalizedPath, localizedPath, normalizePath } from './routes'
import { createT } from './server'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sviydlyasvoih.com.ua').replace(/\/+$/, '')

const PAGE_META_KEYS: Record<string, string> = {
  '/': 'home',
  '/about': 'about',
  '/privacy': 'privacy',
  '/terms-of-use': 'terms',
  '/account-deletion': 'accountDeletion',
  '/support': 'support',
  '/contacts': 'contacts',
  '/catalog': 'catalog',
  '/services': 'services',
}

function currentPath(): string {
  try {
    return normalizePath(headers().get(PATH_HEADER) || '/')
  } catch {
    return '/'
  }
}

/** Absolute URL of a page in a given locale. */
export function absoluteUrl(path: string, locale: Locale): string {
  return `${SITE_URL}${localizedPath(path, locale)}`
}

/** Metadata (title, description, canonical, hreflang, Open Graph, Twitter, robots) for the current request. */
export function buildMetadata(locale: Locale): Metadata {
  const t = createT(locale)
  const path = currentPath()
  const pageKey = PAGE_META_KEYS[path]
  const siteName = t('meta.siteName')
  const title = pageKey ? t(`meta.pages.${pageKey}.title`) : t('meta.siteTitle')
  const description = pageKey ? t(`meta.pages.${pageKey}.description`) : t('meta.siteDescription')
  const isPublic = isPublicLocalizedPath(path)
  const canonical = isPublic ? absoluteUrl(path, locale) : undefined

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords: t('meta.keywords'),
    applicationName: siteName,
    icons: { icon: '/icon.png', apple: '/apple-icon.png' },
    alternates: isPublic
      ? {
          canonical,
          languages: {
            uk: absoluteUrl(path, 'uk'),
            en: absoluteUrl(path, 'en'),
            'x-default': absoluteUrl(path, 'uk'),
          },
        }
      : undefined,
    robots: isPrivatePath(path) ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'website',
      locale: ogLocales[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocales[l]),
      siteName,
      title,
      description,
      url: canonical,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  }
}
