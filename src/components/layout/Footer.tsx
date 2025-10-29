import Link from 'next/link'
import { Heart, Mail, Phone } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="hidden md:block bg-neutral-800 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Про проєкт */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">С</span>
              </div>
              <span className="font-display font-bold text-lg">
                СВІЙ ДЛЯ СВОЇХ
              </span>
            </div>
            <p className="text-neutral-300 mb-4 max-w-md">
              Платформа для пошуку та пропозиції послуг від українців для українців. 
              Підтримуймо одне одного та будуємо сильну спільноту.
            </p>
            <div className="flex items-center space-x-2 text-sm text-neutral-400">
              <Heart className="w-4 h-4 text-primary-500" />
              <span>Зроблено з любов'ю до України</span>
            </div>
          </div>

          {/* Навігація */}
          <div>
            <h3 className="font-semibold mb-4">Навігація</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/catalog" className="text-neutral-300 hover:text-primary-400 transition-colors">
                  Каталог послуг
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-neutral-300 hover:text-primary-400 transition-colors">
                  Про нас
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-neutral-300 hover:text-primary-400 transition-colors">
                  Як це працює
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-neutral-300 hover:text-primary-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Контакти */}
          <div>
            <h3 className="font-semibold mb-4">Контакти</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="mailto:info@sviydliasvoyikh.ua" 
                  className="flex items-center space-x-2 text-neutral-300 hover:text-primary-400 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>info@sviydliasvoyikh.ua</span>
                </a>
              </li>
              <li>
                <a 
                  href="tel:+380123456789" 
                  className="flex items-center space-x-2 text-neutral-300 hover:text-primary-400 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>+380 12 345 67 89</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-400">
          <p>© {currentYear} СВІЙ ДЛЯ СВОЇХ. Всі права захищені.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-primary-400 transition-colors">
              Політика конфіденційності
            </Link>
            <Link href="/terms" className="hover:text-primary-400 transition-colors">
              Умови використання
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
