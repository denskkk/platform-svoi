import type { MetadataRoute } from 'next'
import { PUBLIC_LOCALIZED_PATHS, localizedPath } from '@/i18n/routes'
import { SITE_URL } from '@/i18n/metadata'

const SITEMAP_PATHS = PUBLIC_LOCALIZED_PATHS

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return SITEMAP_PATHS.flatMap((path) => {
    const uk = `${SITE_URL}${localizedPath(path, 'uk')}`
    const en = `${SITE_URL}${localizedPath(path, 'en')}`
    const hasEnglishUrl = uk !== en
    return [
      {
        url: uk,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: path === '/' ? 1 : 0.7,
        alternates: hasEnglishUrl ? { languages: { uk, en } } : undefined,
      },
      ...(hasEnglishUrl
        ? [
            {
              url: en,
              lastModified,
              changeFrequency: 'weekly' as const,
              priority: path === '/' ? 1 : 0.7,
              alternates: { languages: { uk, en } },
            },
          ]
        : []),
    ]
  })
}
