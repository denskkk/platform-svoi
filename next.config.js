/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // КРИТИЧНО: Увімкнути instrumentation для error handlers
  experimental: {
    instrumentationHook: true,
  },

  // Не блокувати production build через ESLint помилки
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Оптимізація зображень
  // Замінено deprecated `images.domains` на `images.remotePatterns`
  images: {
    // Разрешаем загрузку изображений с localhost (dev) по HTTP/HTTPS
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'], // Сучасні формати для меншого розміру
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Responsive sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon sizes
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache на 30 днів
  },

  // Compression для production
  compress: true,

  // Оптимізація JavaScript
  swcMinify: true,

  // Production optimizations
  poweredByHeader: false, // Приховати "X-Powered-By: Next.js" (безпека)
  
  // Оптимізація bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Залишити error та warn
    } : false,
  },

  // Headers для кешування та безпеки
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.{jpg,jpeg,png,gif,webp,avif,svg,ico}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Security headers для всіх сторінок
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

