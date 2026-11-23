import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/i18n/metadata'
import { PRIVATE_PATH_PREFIXES } from '@/i18n/routes'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  // Демо-стенд (DEMO_MODE=1) не індексується пошуковиками
  if (process.env.DEMO_MODE === '1') return { rules: [{ userAgent: '*', disallow: '/' }] }
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
