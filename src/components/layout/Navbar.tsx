'use client'

import Link from 'next/link'
import { Search, User, Menu, LogOut, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AccountTypeBadge } from '@/components/ui/AccountTypeBadge'
import { UserOrCompanyAvatar } from '@/components/ui/UserOrCompanyAvatar'
// create page handles opening the request modal when needed

export function Navbar() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [balance, setBalance] = useState<number | null>(null)
  const [earnIncompleteCount, setEarnIncompleteCount] = useState(0)
  const [profileCompletionPct, setProfileCompletionPct] = useState<number | null>(null)
  // navbar no longer opens the request modal directly; create page handles request flow

  useEffect(() => {
    const readUser = () => {
      try {
        const storedUser = localStorage.getItem('user')
        setUser(storedUser ? JSON.parse(storedUser) : null)
      } catch {
        setUser(null)
      }
    }

    const syncWithServer = async () => {
      try {
        // Use cookie-based auth first (httpOnly cookie). Avoid relying on localStorage token.
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          if (typeof data.user?.balanceUcm === 'number') {
            setBalance(data.user.balanceUcm)
          } else if (data.user?.balanceUcm) {
            const n = Number(data.user.balanceUcm)
            if (!Number.isNaN(n)) setBalance(n)
          }
          try {
            localStorage.setItem('user', JSON.stringify(data.user))
          } catch {}
          
          // Загрузка непрочитанных сообщений (cookie auth)
          try {
            const unreadRes = await fetch('/api/conversations/unread-count', {
              credentials: 'include',
            })
            if (unreadRes.ok) {
              const unreadData = await unreadRes.json()
              setUnreadCount(unreadData.unreadCount || 0)
            }
          } catch {
            // ignore
          }
        } else {
          try {
            localStorage.removeItem('user')
            localStorage.removeItem('token')
          } catch {}
          setUser(null)
        }
      } catch {
        // ignore network errors for navbar
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(() => {
      readUser()
      syncWithServer()
    }, 100)

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') readUser()
    }
    window.addEventListener('storage', onStorage)

    const onAuthChanged = () => readUser()
    window.addEventListener('auth:changed', onAuthChanged as EventListener)

    const onFocus = () => readUser()
    window.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('auth:changed', onAuthChanged as EventListener)
      window.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  // Poll unread counter periodically so the badge updates without reload
  useEffect(() => {
    let timer: any;
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/conversations/unread-count', {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch {}
    }
    // start polling only when user is logged in
    if (user) {
      fetchUnread()
      timer = setInterval(fetchUnread, 10000) // every 10s
      const onFocus = () => fetchUnread()
      window.addEventListener('focus', onFocus)
      document.addEventListener('visibilitychange', onFocus)
      return () => {
        clearInterval(timer)
        window.removeEventListener('focus', onFocus)
        document.removeEventListener('visibilitychange', onFocus)
      }
    }
  }, [user])

  // Fetch earning progress to show badge with remaining unique tasks
  useEffect(() => {
    const fetchEarn = async () => {
      try {
        const res = await fetch('/api/earning/progress', {
          credentials: 'include',
        })
        if (!res.ok) return
        const onEarningUpdated = () => { if (user) fetchEarn(); };
        window.addEventListener('earningUpdated', onEarningUpdated as EventListener);
        return () => { window.removeEventListener('earningUpdated', onEarningUpdated as EventListener); };
        const data = await res.json()
        if (Array.isArray(data.progress)) {
          const count = data.progress.filter((t: any) => !t.completed && !t.isRepeatable).length
          setEarnIncompleteCount(count)
        }
      } catch {
        // silent
      }
    }
    // Only fetch after server sync completed to avoid making requests with stale localStorage user
    if (!isLoading && user) fetchEarn()
  }, [user])

  // Fetch profile completion percent
  useEffect(() => {
    const fetchCompletion = async () => {
      try {
        const res = await fetch('/api/earning/progress', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data.progress)) {
          const prof = data.progress.find((p: any) => p.action === 'PROFILE_COMPLETE')
          if (prof) {
            const pct = prof.progressMax > 0 ? (prof.progress / prof.progressMax) * 100 : 0
            setProfileCompletionPct(Math.round(pct))
          }
        }
      } catch {}
    }
    if (!isLoading && user) fetchCompletion()
      const onEarningUpdated2 = () => { if (user) fetchCompletion(); };
      window.addEventListener('earningUpdated', onEarningUpdated2 as EventListener);
      return () => { window.removeEventListener('earningUpdated', onEarningUpdated2 as EventListener); };
  }, [user])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch {}
    setUser(null)
    setShowProfileMenu(false)
    setIsMenuOpen(false)
    // Повідомляємо інші вкладки/компоненти
    try { window.dispatchEvent(new Event('auth:changed')) } catch {}
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Лого */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xl">С</span>
            </div>
            <span className="font-display font-bold text-lg hidden sm:block">
              СВІЙ ДЛЯ СВОЇХ
            </span>
          </Link>

          {/* Desktop меню */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/catalog" 
              className="text-neutral-700 hover:text-primary-600 transition-colors"
            >
              Люди
            </Link>
            <Link 
              href="/services" 
              className="text-neutral-700 hover:text-primary-600 transition-colors"
            >
              Послуги
            </Link>
            <Link 
              href="/about" 
              className="text-neutral-700 hover:text-primary-600 transition-colors"
            >
              Про нас
            </Link>
            <Link 
              href="/contacts" 
              className="text-neutral-700 hover:text-primary-600 transition-colors"
            >
              Контакти
            </Link>
          </div>

          {/* Права частина */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/services"
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Пошук"
              title="Пошук послуг"
            >
              <Search className="w-5 h-5 text-neutral-600" />
            </Link>

              {/* Mobile messages icon with unread badge */}
              {user && (
                <Link
                  href="/chat"
                  className="relative md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  aria-label="Повідомлення"
                >
                  <MessageCircle className="w-5 h-5 text-neutral-600" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] leading-none rounded-full bg-primary-600 text-white border-2 border-white"
                      title={`${unreadCount} непрочитаних`}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

            {isLoading ? (
              // Показываем загрузку
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-24 h-10 bg-neutral-200 rounded-lg animate-pulse"></div>
                <div className="w-32 h-10 bg-neutral-200 rounded-lg animate-pulse"></div>
              </div>
            ) : user ? (
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/services/create" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium">
                  + Створити послугу
                </Link>
                <Link href="/requests/create" className="px-4 py-2 border border-primary-500 hover:bg-primary-50 text-primary-600 rounded-lg transition-colors font-medium">
                  + Створити заявку
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <UserOrCompanyAvatar user={user} className="w-8 h-8 rounded-full object-cover" />
                    <span className="font-medium text-neutral-700 flex flex-col items-start leading-tight">
                      <span>{user?.businessInfo?.companyName || user?.firstName}</span>
                      {balance !== null && (
                        <span className="text-[11px] text-neutral-500 font-normal">{balance.toFixed(2)} уцмка</span>
                      )}
                      {profileCompletionPct !== null && profileCompletionPct < 100 && (
                        <span className="text-[10px] text-indigo-600 font-semibold">Профіль {profileCompletionPct}%</span>
                      )}
                    </span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 py-2">
                      {/* Account Type Badge */}
                      <div className="px-4 py-3 border-b border-neutral-200">
                        <p className="text-xs text-neutral-500 mb-2">Тип акаунту</p>
                        <AccountTypeBadge accountType={user.accountType || 'basic'} size="sm" />
                      </div>
                      
                      <Link
                        href={`/profile/${user.id}`}
                        className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Мій профіль
                      </Link>
                      {profileCompletionPct !== null && profileCompletionPct < 100 && (
                        <div className="px-4 py-2 text-neutral-700 flex items-center justify-between text-xs">
                          <span>Заповнено</span>
                          <span className="font-medium text-indigo-600">{profileCompletionPct}%</span>
                        </div>
                      )}
                      {balance !== null && (
                        <div className="px-4 py-2 text-neutral-700 flex items-center justify-between">
                          <span>Баланс</span>
                          <span className="font-medium">{balance.toFixed(2)} уцмка</span>
                        </div>
                      )}
                      <Link
                        href="/profile/edit"
                        className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Редагувати профіль
                      </Link>
                      <Link
                        href="/earn"
                        className="block px-4 py-2 text-green-600 hover:bg-green-50 font-medium"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        💰 Як заробити уцмки
                        {earnIncompleteCount > 0 && (
                          <span
                            className="ml-2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[11px] leading-none rounded-full bg-green-600 text-white font-semibold"
                            title={`${earnIncompleteCount} невиконаних завдань`}
                          >
                            {earnIncompleteCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/upgrade"
                        className="block px-4 py-2 text-indigo-600 hover:bg-indigo-50 font-medium"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        ⚡ Покращити акаунт
                      </Link>
                      <div className="border-t border-neutral-200 my-2"></div>
                      <Link
                        href="/chat"
                        className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 flex items-center justify-between"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <span>Повідомлення</span>
                        {unreadCount > 0 && (
                          <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/favorites"
                        className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Обране
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-neutral-100 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Вийти</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-neutral-700 hover:text-primary-600 transition-colors"
                >
                  Увійти
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
                >
                  Створити профіль
                </Link>
              </div>
            )}

            {/* Mobile: Показати CTA реєстрації одразу у шапці, якщо не залогінений */}
            {!isLoading && !user && (
              <Link
                href="/auth/register"
                className="md:hidden px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Створити профіль
              </Link>
            )}

            <button
              className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Меню"
            >
              <Menu className="w-6 h-6 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile меню */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <Link 
              href="/catalog" 
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Люди
            </Link>
            <Link 
              href="/services" 
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Послуги
            </Link>
            <Link 
              href="/about" 
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Про нас
            </Link>
            <Link 
              href="/contacts" 
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Контакти
            </Link>

            {/* Auth-dependent section */}
            <div className="pt-2 border-t border-neutral-200">
              {isLoading ? (
                <>
                  <div className="h-10 bg-neutral-200 rounded-lg animate-pulse mb-2"></div>
                  <div className="h-10 bg-neutral-200 rounded-lg animate-pulse"></div>
                </>
              ) : user ? (
                <>
                  <Link
                    href={`/profile/${user.id}`}
                    className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Мій профіль
                  </Link>
                  {balance !== null && (
                    <div className="px-4 py-2 text-neutral-700 rounded-lg flex items-center justify-between">
                      <span>Баланс</span>
                      <span className="font-medium">{balance.toFixed(2)} уцмка</span>
                    </div>
                  )}
                  <Link
                    href="/earn"
                    className="block px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    💰 Як заробити уцмки
                    {earnIncompleteCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[11px] leading-none rounded-full bg-green-600 text-white font-semibold" title={`${earnIncompleteCount} невиконаних завдань`}>
                        {earnIncompleteCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/upgrade"
                    className="block px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ⚡ Покращити акаунт
                  </Link>
                  <Link
                    href="/profile/edit"
                    className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Редагувати профіль
                  </Link>
                  <Link
                    href="/services/create"
                    className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    + Додати послугу
                  </Link>
                  <Link
                    href="/requests/create"
                    className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    + Створити заявку
                  </Link>
                  <Link
                    href="/favorites"
                    className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Обране
                  </Link>
                  <Link
                    href="/chat"
                    className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors flex items-center justify-between"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Повідомлення</span>
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={async () => { await handleLogout(); setIsMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    Вийти
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Увійти
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium text-center mt-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Створити профіль
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
