import Link from 'next/link'
import Image from 'next/image'
import { Heart, Send } from 'lucide-react'
import { getT } from '@/i18n/server'
import { localizedPath } from '@/i18n/routes'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export function Footer() {
  const { t, locale } = getT()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="hidden md:block bg-neutral-800 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Про проєкт */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Image
                src="/logo.png"
                alt={t('layout.brand.logoAlt')}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
              />
              <span className="font-display font-bold text-lg">
                {t('layout.brand.name')}
              </span>
            </div>
            <p className="text-neutral-300 mb-4 max-w-md">
              {t('layout.footer.description')}
            </p>
            <div className="flex items-center space-x-2 text-sm text-neutral-400">
              <Heart className="w-4 h-4 text-primary-500" />
              <span>{t('layout.footer.madeWithLove')}</span>
            </div>
          </div>

          {/* Навігація */}
          <div>
            <h3 className="font-semibold mb-4">{t('layout.footer.navigation')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/catalog" className="text-neutral-300 hover:text-primary-400 transition-colors">
                  {t('layout.footer.catalog')}
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-neutral-300 hover:text-primary-400 transition-colors">
                  {t('layout.footer.services')}
                </Link>
              </li>
              <li>
                <Link href="/public-requests" className="text-neutral-300 hover:text-primary-400 transition-colors">
                  {t('layout.footer.requests')}
                </Link>
              </li>
              <li>
                <Link href={localizedPath('/about', locale)} className="text-neutral-300 hover:text-primary-400 transition-colors">
                  {t('layout.footer.about')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Адміністрація */}
          <div>
            <h3 className="font-semibold mb-4">{t('layout.footer.administration')}</h3>
            <a 
              href="https://t.me/sviydlyasvoih" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-neutral-300 hover:text-primary-400 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{t('layout.footer.adminLink')}</span>
            </a>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-400">
          <p>{t('layout.footer.copyright', { year: currentYear })}</p>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-4 md:mt-0">
            <Link href={localizedPath('/privacy', locale)} className="hover:text-primary-400 transition-colors">
              {t('layout.footer.privacy')}
            </Link>
            <Link href={localizedPath('/terms-of-use', locale)} className="hover:text-primary-400 transition-colors">
              {t('layout.footer.terms')}
            </Link>
            <Link href={localizedPath('/account-deletion', locale)} className="hover:text-primary-400 transition-colors">
              {t('layout.footer.accountDeletion')}
            </Link>
            <Link href={localizedPath('/support', locale)} className="hover:text-primary-400 transition-colors">
              {t('layout.footer.support')}
            </Link>
            <Link href={localizedPath('/contacts', locale)} className="hover:text-primary-400 transition-colors">
              {t('layout.footer.contacts')}
            </Link>
            <LanguageSwitcher variant="buttons" />
          </div>
        </div>
      </div>
    </footer>
  )
}
