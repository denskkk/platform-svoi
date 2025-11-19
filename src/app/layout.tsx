import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'
import { UpgradeBanner } from '@/components/ui/UpgradeBanner'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
})

const montserrat = Montserrat({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'СВІЙ ДЛЯ СВОЇХ — Українська платформа послуг',
  description: 'Підтримуй своїх — знайди потрібну людину поруч. Платформа для пошуку та пропозиції послуг від українців для українців.',
  keywords: 'українські послуги, майстри, фахівці, підтримка українського, свій для своїх',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body className={`${inter.variable} ${montserrat.variable} font-sans`}>
        <Navbar />
        <UpgradeBanner />
        <main className="min-h-screen pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  )
}
