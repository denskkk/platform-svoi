'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Home, Clapperboard, User, MessageCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { AccountTypeBadge } from '@/components/ui/AccountTypeBadge'
import { checkAuth } from '@/lib/silentFetch'
import { useI18n } from '@/i18n/client'
import { localizedPath, splitLocalePrefix } from '@/i18n/routes'
import { CreateSheet } from '@/components/layout/CreateSheet'
import { CreatorHost } from '@/components/create/Creator'

// Низ як у TikTok/Facebook: Стрічка · Рілси · «+» · Чат · Проєкти · Кабінет (пошуку тут немає — він угорі стрічки та в проєктах)
const navItems = [
  { href: '/feed', icon: Home, labelKey: 'cabinet.nav.home' },
  { href: '/video', icon: Clapperboard, labelKey: 'cabinet.nav.reels' },
  { href: '/create', icon: Plus, labelKey: 'cabinet.nav.create', create: true },
  { href: '/chat', icon: MessageCircle, labelKey: 'cabinet.nav.messages', badge: true },
  { href: '/projects', icon: LayoutGrid, labelKey: 'cabinet.nav.projects' },
  { href: '/profile', icon: User, labelKey: 'cabinet.nav.cabinet' },
] as { href: string; icon: any; labelKey: string; create?: boolean; badge?: boolean }[]

export function MobileNav() {
  const { t, locale } = useI18n()
  const rawPathname = usePathname()
  const pathname = splitLocalePrefix(rawPathname || '/').path
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(false)
  const [unread, setUnread] = useState(0)

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
    // Лічильник непрочитаних надсилає верхня панель (одне опитування на весь застосунок)
    const onUnread = (e: Event) => setUnread(Number((e as CustomEvent<number>).detail) || 0)
    window.addEventListener('svoi:unread', onUnread)
    return () => { window.removeEventListener('auth:changed', onAuthChanged); window.removeEventListener('svoi:unread', onUnread) }
  }, [])

  // Поки йде перевірка — показуємо звичну навігацію, аби уникнути стрибків
  const isAuthed = !!user
  const items = navItems

  if (loading) {
    return (
      <nav className="mobile-nav-bar lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-[var(--safe-area-inset-bottom,0px)] bg-[#0a1f44] border-t border-white/10 shadow-lg">
        <div className="grid grid-cols-6 h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <div key={item.href} className={cn('flex flex-col items-center justify-center space-y-1', isActive ? 'text-primary-400' : 'text-white/40')}>
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{t(item.labelKey)}</span>
              </div>
            )
          })}
        </div>
      </nav>
    )
  }

  // Гостю: три розділи для перегляду та дві явні кнопки «Увійти» і «Зареєструватись»
  if (!isAuthed) {
    const tabs = [navItems[0], navItems[1], navItems[4]]
    return (
      <nav className="mobile-nav-bar lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-[var(--safe-area-inset-bottom,0px)] bg-[#0a1f44] border-t border-white/10 shadow-[0_-4px_20px_rgba(10,31,68,0.35)]">
        <div className="flex items-center h-16 px-1 gap-1">
          {tabs.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`) || (item.href === '/feed' && pathname === '/')
            return (
              <Link key={item.href} href={localizedPath(item.href, locale)} className={cn('flex-1 min-w-0 flex flex-col items-center justify-center space-y-0.5', isActive ? 'text-primary-400' : 'text-white/70')}>
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium truncate max-w-full">{t(item.labelKey)}</span>
              </Link>
            )
          })}
          <Link href="/auth/login" className="shrink-0 rounded-xl border-2 border-primary-400 text-white font-bold text-sm px-3 py-2.5 text-center">
            {t('layout.navbar.login')}
          </Link>
          <Link href="/auth/register" className="shrink-0 rounded-xl bg-primary-500 text-neutral-900 font-extrabold text-sm px-3 py-2.5 text-center shadow-md">
            {t('common.guest.register')}
          </Link>
        </div>
      </nav>
    )
  }

  // Авторизованим — 6 кнопок
  return (
    <>
      <nav className="mobile-nav-bar lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-[var(--safe-area-inset-bottom,0px)] bg-[#0a1f44] border-t border-white/10 shadow-[0_-4px_20px_rgba(10,31,68,0.35)]">
        <div className="grid grid-cols-6 h-16">
          {items.map((item) => {
            const Icon = item.icon
            if (item.create) {
              return (
                <button key="create" type="button" onClick={() => setSheet(true)} aria-label={t(item.labelKey)} className="flex items-center justify-center">
                  <span className="flex h-10 w-12 items-center justify-center rounded-xl bg-primary-500 text-neutral-900 shadow-md active:scale-95 transition">
                    <Plus className="w-6 h-6 stroke-[3]" />
                  </span>
                </button>
              )
            }
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`) || (item.href === '/profile' && pathname.startsWith('/menu'))
            return (
              <Link
                key={item.href}
                href={localizedPath(item.href, locale)}
                className={cn(
                  'flex flex-col items-center justify-center space-y-1 transition-colors min-w-0 px-0.5',
                  isActive ? 'text-primary-400' : 'text-white/70 hover:text-white'
                )}
              >
                <span className="relative">
                  <Icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
                  {item.badge && unread > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[1.1rem] h-[1.1rem] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">{unread > 9 ? '9+' : unread}</span>
                  )}
                </span>
                <span className="text-[10px] min-[380px]:text-[11px] font-medium truncate max-w-full">{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      {sheet && <CreateSheet onClose={() => setSheet(false)} />}
      <CreatorHost />
    </>
  )
}
