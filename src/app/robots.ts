import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/i18n/metadata'
import { PRIVATE_PATH_PREFIXES } from '@/i18n/routes'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...PRIVATE_PATH_PREFIXES, '/en/api'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
