'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Car, Clapperboard, Home, HeartPulse, Newspaper, Search, Store, Trophy, Users, Wallet, Wrench } from 'lucide-react'
import { useAuthStatus } from '@/components/ui/AuthGate'
import { useI18n } from '@/i18n/client'

const FEATURES = [
  { key: 'feed', icon: Newspaper },
  { key: 'video', icon: Clapperboard },
  { key: 'projects', icon: Store },
  { key: 'business', icon: Building2 },
  { key: 'clubs', icon: Users },
  { key: 'earn', icon: Wallet },
] as const

const DIRECTIONS = [
  { key: 'cars', icon: Car },
  { key: 'realEstate', icon: Home },
  { key: 'health', icon: HeartPulse },
  { key: 'sport', icon: Trophy },
  { key: 'services', icon: Wrench },
  { key: 'shops', icon: Store },
] as const

/** Головна для гостей: що таке платформа, куди вона веде та як зареєструватися. Авторизованих перекидає у стрічку HomeRedirect. */
export function SocialLanding() {
  const { t } = useI18n()
  const router = useRouter()
  const { status } = useAuthStatus()
  const [q, setQ] = useState('')
  const guest = status !== 'authed'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search')
  }

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 pt-16 pb-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-primary-700">{t('home.social.badge')}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold text-neutral-900 leading-tight">{t('home.social.title')}</h1>
          <p className="mt-4 text-lg text-neutral-600 max-w-2xl mx-auto">{t('home.social.subtitle')}</p>

          {guest && (
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/register" className="rounded-full bg-primary-500 hover:bg-primary-600 text-white font-bold px-8 py-3.5 shadow-lg transition">
                {t('home.social.register')}
              </Link>
              <Link href="/auth/login" className="rounded-full border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold px-8 py-3.5 transition">
                {t('home.social.login')}
              </Link>
            </div>
          )}
          {guest && <p className="mt-3 text-sm text-neutral-500">{t('home.social.registerNote')}</p>}

          <form onSubmit={submit} className="mt-8 max-w-xl mx-auto flex items-center gap-2 rounded-full bg-white shadow-md border border-neutral-200 pl-5 pr-2 py-2">
            <Search className="w-5 h-5 text-neutral-400 shrink-0" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.social.searchPlaceholder')} aria-label={t('home.social.searchPlaceholder')}
              className="flex-1 min-w-0 bg-transparent outline-none text-base" />
            <button type="submit" className="rounded-full bg-neutral-900 text-white text-sm font-semibold px-5 py-2">{t('home.social.searchButton')}</button>
          </form>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center">{t('home.social.featuresTitle')}</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ key, icon: Icon }) => (
              <div key={key} className="rounded-2xl border border-neutral-200 p-5 hover:shadow-md transition">
                <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center"><Icon className="w-6 h-6" /></div>
                <h3 className="mt-4 font-semibold text-neutral-900">{t(`home.social.features.${key}.title`)}</h3>
                <p className="mt-1 text-sm text-neutral-600">{t(`home.social.features.${key}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 text-center">{t('home.social.directionsTitle')}</h2>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {DIRECTIONS.map(({ key, icon: Icon }) => (
              <Link key={key} href={guest ? '/auth/register' : '/projects'} className="rounded-2xl bg-white border border-neutral-200 p-4 text-center hover:shadow-md transition">
                <Icon className="w-7 h-7 mx-auto text-accent-600" />
                <p className="mt-2 text-sm font-medium text-neutral-800">{t(`home.social.directions.${key}`)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t('home.social.earnTitle')}</h2>
          <p className="mt-3 text-neutral-600">{t('home.social.earnText')}</p>
          <ol className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
            {(['s1', 's2', 's3'] as const).map((k, i) => (
              <li key={k} className="rounded-2xl bg-neutral-50 p-5">
                <span className="inline-flex w-8 h-8 rounded-full bg-primary-500 text-white font-bold items-center justify-center">{i + 1}</span>
                <p className="mt-3 text-sm text-neutral-700">{t(`home.social.earnSteps.${k}`)}</p>
              </li>
            ))}
          </ol>
          <Link href={guest ? '/auth/register' : '/earnings'} className="mt-8 inline-block rounded-full bg-accent-500 hover:bg-accent-600 text-white font-bold px-8 py-3 transition">
            {t('home.social.earnCta')}
          </Link>
        </div>
      </section>
    </>
  )
}
