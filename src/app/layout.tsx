import type { Metadata, Viewport } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'
import { OpenInAppBanner } from '@/components/layout/OpenInAppBanner'
import { NativeLinkHandler } from '@/components/layout/NativeLinkHandler'
import { ViewportSync } from '@/components/layout/ViewportSync'
import AdminRedirect from '@/components/AdminRedirect'
import { ToastProvider } from '@/components/ui/Toast'
import { ConfirmHost } from '@/components/ui/ConfirmHost'
import { AuthSessionMonitor } from '@/components/ui/AuthSessionMonitor'
import { ServiceWorkerRegister } from '@/components/ui/ServiceWorkerRegister'
import { I18nProvider } from '@/i18n/client'
import { getClientMessages } from '@/i18n/messages'
import { getLocale } from '@/i18n/server'
import { buildMetadata } from '@/i18n/metadata'
import { SafeAreaInit } from '@/components/ui/SafeAreaInit'

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
  viewportFit: 'cover', // контент під вирізом/«острівцем»: відступи дають --safe-area-inset-*
  themeColor: '#FFCA00',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = getLocale()
  const messages = getClientMessages(locale)

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${montserrat.variable} font-sans`}>
        <I18nProvider locale={locale} messages={messages}>
          <ToastProvider>
            <ConfirmHost />
            <SafeAreaInit />
            <AuthSessionMonitor />
            <ServiceWorkerRegister />
            <AdminRedirect />
            <NativeLinkHandler />
            <ViewportSync />
            <OpenInAppBanner />
            <Navbar />
            <main className="min-h-[100dvh] pb-[calc(5rem+var(--safe-area-inset-bottom,0px))] lg:pb-0">
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
