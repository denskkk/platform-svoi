import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'СВІЙ ДЛЯ СВОЇХ',
    short_name: 'Свій для Своїх',
    description: 'Українська платформа для пошуку та пропозиції послуг',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#FFCA00',
    lang: 'uk',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
