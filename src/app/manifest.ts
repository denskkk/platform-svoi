import type { MetadataRoute } from 'next'
import { getLocale, createT } from '@/i18n/server'

export default function manifest(): MetadataRoute.Manifest {
  const locale = getLocale()
  const t = createT(locale)
  return {
    name: t('meta.siteName'),
    short_name: t('meta.manifestShortName'),
    description: t('meta.siteDescription'),
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#FFCA00',
    lang: locale,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
