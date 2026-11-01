import type { Metadata, Viewport } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'
import AdminRedirect from '@/components/AdminRedirect'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthSessionMonitor } from '@/components/ui/AuthSessionMonitor'
import { ServiceWorkerRegister } from '@/components/ui/ServiceWorkerRegister'
import { I18nProvider } from '@/i18n/client'
import { getMessages } from '@/i18n/messages'
import { getLocale } from '@/i18n/server'
import { buildMetadata } from '@/i18n/metadata'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
})

const montserrat = Montserrat({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
})

export function generateMetadata(): Metadata {
  return buildMetadata(getLocale())
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
  const locale = getLocale()
  const messages = getMessages(locale)

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${montserrat.variable} font-sans`}>
        <I18nProvider locale={locale} messages={messages}>
          <ToastProvider>
            <AuthSessionMonitor />
            <ServiceWorkerRegister />
            <AdminRedirect />
            <Navbar />
            <main className="min-h-screen pb-20 md:pb-0">
              {children}
            </main>
            <Footer />
            <MobileNav />
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
