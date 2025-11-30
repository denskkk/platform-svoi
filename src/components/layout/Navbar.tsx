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
  const [isLoading, setIsLoading] = useState(false) // Изменено с true на false
  const [unreadCount, setUnreadCount] = useState(0)
  const [balance, setBalance] = useState<number | null>(null)
  const [earnIncompleteCount, setEarnIncompleteCount] = useState(0)
  const [profileCompletionPct, setProfileCompletionPct] = useState<number | null>(null)
  const [newRequestsCount, setNewRequestsCount] = useState(0)
  // navbar no longer opens the request modal directly; create page handles request flow

  useEffect(() => {
    const readUser = () => {
      try {
        const storedUser = localStorage.getItem('user')
        const parsedUser = storedUser ? JSON.parse(storedUser) : null
        setUser(parsedUser)
        // Если пользователь есть в localStorage, сразу показываем его данные
        if (parsedUser) {
          setIsLoading(false)
        }
      } catch {
        setUser(null)
      }
    }

    // Сначала читаем из localStorage для мгновенного отображения
    readUser()

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
          
          // Загрузка новых заявок
          try {
            const requestsRes = await fetch('/api/service-requests/new-count', {
              credentials: 'include',
            })
            if (requestsRes.ok) {
              const requestsData = await requestsRes.json()
              setNewRequestsCount(requestsData.count || 0)
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

    // Защита: установить isLoading = false через 3 секунды в любом случае
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') readUser()
    }
    window.addEventListener('storage', onStorage)

    const onAuthChanged = () => readUser()
    window.addEventListener('auth:changed', onAuthChanged as EventListener)

    const onFocus = () => {
      readUser()
      // При фокусе также синхронизируем с сервером
      syncWithServer()
    }
    window.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)

    return () => {
      clearTimeout(timer)
      clearTimeout(fallbackTimer)
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
      
      // Також оновлюємо кількість нових заявок
      try {
        const requestsRes = await fetch('/api/service-requests/new-count', {
          credentials: 'include',
        })
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json()
          setNewRequestsCount(requestsData.count || 0)
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
        const data = await res.json()
        if (Array.isArray(data.progress)) {
          const count = data.progress.filter((t: any) => !t.completed && !t.isRepeatable).length
          setEarnIncompleteCount(count)
        }
      } catch {
        // silent
      }
    }
    
    if (!isLoading && user) {
      fetchEarn()
      const onEarningUpdated = () => { fetchEarn(); };
      window.addEventListener('earningUpdated', onEarningUpdated as EventListener);
      return () => { window.removeEventListener('earningUpdated', onEarningUpdated as EventListener); };
    }
  }, [user, isLoading])

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
    
    if (!isLoading && user) {
      fetchCompletion()
      const onEarningUpdated2 = () => { fetchCompletion(); };
      window.addEventListener('earningUpdated', onEarningUpdated2 as EventListener);
      return () => { window.removeEventListener('earningUpdated', onEarningUpdated2 as EventListener); };
    }
  }, [user, isLoading])

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
            <img src="/sitelogo.png" alt="Логотип" className="w-10 h-10 object-contain transform group-hover:scale-105 transition-transform" />
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
              href="/public-requests" 
              className="text-neutral-700 hover:text-primary-600 transition-colors"
            >
              Заявки
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
                {/* Глядачі не можуть створювати послуги */}
                {user.accountType !== 'viewer' && (
                  <Link href="/services/create" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium">
                    + Створити послугу
                  </Link>
                )}
                {user.accountType !== 'viewer' && (
                  <Link href="/requests/create" className="px-4 py-2 border border-primary-500 hover:bg-primary-50 text-primary-600 rounded-lg transition-colors font-medium">
                    + Створити заявку
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <UserOrCompanyAvatar user={user} className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex flex-col items-start leading-tight max-w-[120px]">
                      <span className="font-medium text-neutral-700 truncate text-sm">
                        {user?.businessInfo?.companyName || user?.firstName}
                      </span>
                      {balance !== null && (
                        <span className="text-[11px] text-neutral-500 font-normal">
                          {balance.toFixed(2)} уцмка
                        </span>
                      )}
                    </div>
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
                        href="/service-requests?type=tome"
                        className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 flex items-center justify-between"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <span>📩 Заявки мені</span>
                        {newRequestsCount > 0 && (
                          <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
                            {newRequestsCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/service-requests?type=my"
                        className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 flex items-center justify-between"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <span>📝 Мої заявки</span>
                      </Link>
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
        <div className="md:hidden border-t border-neutral-200 bg-white shadow-lg max-h-[calc(100vh-64px)] overflow-y-auto">
          <div className="px-3 py-3 space-y-1">
            {/* Профиль пользователя вверху (если залогинен) */}
            {user && (
              <div className="mb-4 p-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <UserOrCompanyAvatar user={user} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">
                      {user?.businessInfo?.companyName || `${user?.firstName} ${user?.lastName}`}
                    </p>
                    {balance !== null && (
                      <p className="text-sm text-neutral-600">
                        💰 {balance.toFixed(2)} уцмка
                      </p>
                    )}
                    {profileCompletionPct !== null && profileCompletionPct < 100 && (
                      <p className="text-xs text-indigo-600 font-medium mt-1">
                        Профіль {profileCompletionPct}% заповнений
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Основная навигация */}
            <div className="space-y-1">
              <p className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Навігація
              </p>
              <Link 
                href="/catalog" 
                className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-xl mr-3">👥</span>
                <span>Люди</span>
              </Link>
              <Link 
                href="/services" 
                className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-xl mr-3">🛠️</span>
                <span>Послуги</span>
              </Link>
              <Link 
                href="/public-requests" 
                className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-xl mr-3">📋</span>
                <span>Заявки</span>
              </Link>
              <Link 
                href="/about" 
                className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-xl mr-3">ℹ️</span>
                <span>Про нас</span>
              </Link>
              <Link 
                href="/contacts" 
                className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-xl mr-3">📞</span>
                <span>Контакти</span>
              </Link>
            </div>

            {/* Действия пользователя */}
            {user && (
              <div className="pt-3 mt-3 border-t border-neutral-200 space-y-1">
                <p className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Мій акаунт
                </p>
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-xl mr-3">👤</span>
                  <span>Мій профіль</span>
                </Link>
                <Link
                  href="/profile/edit"
                  className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-xl mr-3">✏️</span>
                  <span>Редагувати профіль</span>
                </Link>
                <Link
                  href="/chat"
                  className="flex items-center justify-between px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3">💬</span>
                    <span>Повідомлення</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-primary-600 text-white text-xs rounded-full px-2.5 py-1 font-semibold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/favorites"
                  className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-xl mr-3">⭐</span>
                  <span>Обране</span>
                </Link>
              </div>
            )}

            {/* Создание контента */}
            {user && user.accountType !== 'viewer' && (
              <div className="pt-3 mt-3 border-t border-neutral-200 space-y-1">
                <p className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Створити
                </p>
                <Link
                  href="/services/create"
                  className="flex items-center px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors font-medium shadow-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-xl mr-3">➕</span>
                  <span>Додати послугу</span>
                </Link>
                <Link
                  href="/requests/create"
                  className="flex items-center px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-colors font-medium shadow-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-xl mr-3">📝</span>
                  <span>Створити заявку</span>
                </Link>
              </div>
            )}

            {/* Заявки */}
            {user && (
              <div className="pt-3 mt-3 border-t border-neutral-200 space-y-1">
                <p className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Заявки
                </p>
                <Link
                  href="/service-requests?type=tome"
                  className="flex items-center justify-between px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3">📩</span>
                    <span>Заявки мені</span>
                  </div>
                  {newRequestsCount > 0 && (
                    <span className="bg-green-600 text-white text-xs rounded-full px-2.5 py-1 font-semibold">
                      {newRequestsCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/service-requests?type=my"
                  className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-xl mr-3">📄</span>
                  <span>Мої заявки</span>
                </Link>
              </div>
            )}

            {/* Заработок и улучшения */}
            {user && (
              <div className="pt-3 mt-3 border-t border-neutral-200 space-y-1">
                <p className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Розвиток
                </p>
                <Link
                  href="/earn"
                  className="flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3">💰</span>
                    <span>Як заробити уцмки</span>
                  </div>
                  {earnIncompleteCount > 0 && (
                    <span className="bg-green-600 text-white text-xs rounded-full px-2.5 py-1 font-semibold">
                      {earnIncompleteCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/upgrade"
                  className="flex items-center px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-xl mr-3">⚡</span>
                  <span>Покращити акаунт</span>
                </Link>
              </div>
            )}

            {/* Авторизация / Выход */}
            <div className="pt-3 mt-3 border-t border-neutral-200 space-y-1 pb-4">
              {user ? (
                <>
                  <button
                    onClick={async () => { await handleLogout(); setIsMenuOpen(false) }}
                    className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                  >
                    <span className="text-xl mr-3">🚪</span>
                    <span>Вийти</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-xl mr-3">🔑</span>
                    <span>Увійти</span>
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex items-center justify-center px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors font-medium shadow-md mt-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-xl mr-3">✨</span>
                    <span>Створити профіль</span>
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
