import Link from 'next/link'
import { getT } from '@/i18n/server'
import { localizedPath } from '@/i18n/routes'

export default function NotFound() {
  const { t, locale } = getT()
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-8">
        <p className="text-5xl font-bold text-primary-600 mb-2">404</p>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">{t('common.notFound.title')}</h1>
        <p className="text-neutral-600 mb-6">{t('common.notFound.description')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={localizedPath('/', locale)} className="px-5 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
            {t('common.actions.goHome')}
          </Link>
          <Link href="/catalog" className="px-5 py-3 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50">
            {t('common.notFound.toCatalog')}
          </Link>
        </div>
      </div>
    </div>
  )
}
