import type { Metadata, Viewport } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'
import AdminRedirect from '@/components/AdminRedirect'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthSessionMonitor } from '@/components/ui/AuthSessionMonitor'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
})

const montserrat = Montserrat({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sviydlyasvoih.com.ua'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'СВІЙ ДЛЯ СВОЇХ — Українська платформа послуг',
  description: 'Підтримуй своїх — знайди потрібну людину поруч. Платформа для пошуку та пропозиції послуг від українців для українців.',
  keywords: 'українські послуги, майстри, фахівці, підтримка українського, свій для своїх',
  applicationName: 'СВІЙ ДЛЯ СВОЇХ',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: 'СВІЙ ДЛЯ СВОЇХ',
    title: 'СВІЙ ДЛЯ СВОЇХ — Українська платформа послуг',
    description: 'Підтримуй своїх — знайди потрібну людину поруч.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'СВІЙ ДЛЯ СВОЇХ' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFCA00',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body className={`${inter.variable} ${montserrat.variable} font-sans`}>
        <ToastProvider>
          <AuthSessionMonitor />
          <AdminRedirect />
          <Navbar />
          <main className="min-h-screen pb-20 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileNav />
        </ToastProvider>
      </body>
    </html>
  )
}
