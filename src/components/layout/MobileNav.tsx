'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Newspaper, Search, MessageCircle, User, UserPlus, Eye, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { AccountTypeBadge } from '@/components/ui/AccountTypeBadge'
import { checkAuth } from '@/lib/silentFetch'
import { useI18n } from '@/i18n/client'
import { localizedPath, splitLocalePrefix } from '@/i18n/routes'

const navItems = [
  { href: '/feed', icon: Newspaper, labelKey: 'layout.mobileNav.feed' },
  { href: '/catalog', icon: Search, labelKey: 'layout.mobileNav.search' },
  { href: '/chat', icon: MessageCircle, labelKey: 'layout.mobileNav.messages' },
  { href: '/profile', icon: User, labelKey: 'layout.mobileNav.profile' },
]

export function MobileNav() {
  const { t, locale } = useI18n()
  const rawPathname = usePathname()
  const pathname = splitLocalePrefix(rawPathname || '/').path
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const readLocal = () => {
      try {
        const u = localStorage.getItem('user')
        setUser(u ? JSON.parse(u) : null)
      } catch { setUser(null) }
    }

    const verify = async () => {
      try {
        const auth = await checkAuth()
        if (auth.status === 'authed') {
          setUser(auth.user)
          try { localStorage.setItem('user', JSON.stringify(auth.user)) } catch {}
        } else if (auth.status === 'guest') {
          setUser(null)
        }
        // 'unavailable' (мережа/сервер): не вилогінюємо
      } catch { /* noop */ }
      finally { setLoading(false) }
    }

    readLocal()
    verify()

    // Оновлюємо навігацію одразу після входу/виходу, без перезавантаження сторінки
    const onAuthChanged = () => { readLocal(); verify() }
    window.addEventListener('auth:changed', onAuthChanged)
    return () => window.removeEventListener('auth:changed', onAuthChanged)
  }, [])

  // Поки йде перевірка — показуємо звичну навігацію, аби уникнути стрибків
  const isAuthed = !!user
  // Глядачі не можуть писати повідомлення — замість чату показуємо "Обране"
  const items = user?.accountType === 'viewer'
    ? navItems.map((item) => (item.href === '/chat' ? { href: '/favorites', icon: Heart, labelKey: 'layout.mobileNav.favorites' } : item))
    : navItems

  if (loading) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[var(--safe-area-inset-bottom,0px)] bg-white border-t border-neutral-200 shadow-lg">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <div key={item.href} className={cn('flex flex-col items-center justify-center space-y-1', isActive ? 'text-primary-600' : 'text-neutral-300')}>
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{t(item.labelKey)}</span>
              </div>
            )
          })}
        </div>
      </nav>
    )
  }

  // Неавторизованим показуємо дві великі дії: Реєстрація та Перегляд як глядач
  if (!isAuthed) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[var(--safe-area-inset-bottom,0px)] bg-white border-t border-neutral-200 shadow-lg">
        <div className="grid grid-cols-2 h-16">
          <Link
            href="/auth/register"
            className={cn('flex flex-col items-center justify-center space-y-1 text-white bg-primary-500 hover:bg-primary-600 transition-colors')}
          >
            <UserPlus className="w-6 h-6" />
            <span className="text-xs font-semibold">{t('layout.mobileNav.register')}</span>
          </Link>
          <Link
            href="/auth/register/viewer"
            className={cn('flex flex-col items-center justify-center space-y-1 text-neutral-700 hover:text-primary-600')}
          >
            <Eye className="w-6 h-6" />
            <span className="text-xs font-medium">{t('layout.mobileNav.viewer')}</span>
          </Link>
        </div>
      </nav>
    )
  }

  // Авторизованим — стандартні 4 пункти
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[var(--safe-area-inset-bottom,0px)] bg-white border-t border-neutral-200 shadow-lg">
      <div className="grid grid-cols-4 h-16">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={localizedPath(item.href, locale)}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 transition-colors min-w-0 px-1',
                isActive ? 'text-primary-600' : 'text-neutral-500 hover:text-primary-500'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[11px] min-[360px]:text-xs font-medium truncate max-w-full">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
