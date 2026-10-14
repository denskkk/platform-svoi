'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search, User, Menu, LogOut, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AccountTypeBadge } from '@/components/ui/AccountTypeBadge'
import { UserOrCompanyAvatar } from '@/components/ui/UserOrCompanyAvatar'
import { silentFetch } from '@/lib/silentFetch'
// create page handles opening the request modal when needed

export function Navbar() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(false) // Изменено с true на false
  const [unreadCount, setUnreadCount] = useState(0)
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
        const res = await silentFetch('/api/auth/me', {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          try {
            localStorage.setItem('user', JSON.stringify(data.user))
          } catch {}
          
          // Загрузка непрочитанных сообщений (cookie auth)
          try {
            const unreadRes = await silentFetch('/api/conversations/unread-count', {
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
            const requestsRes = await silentFetch('/api/service-requests/new-count', {
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
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Лого */}
          <Link href="/" className="flex items-center space-x-2 group shrink-0" aria-label="СВІЙ ДЛЯ СВОЇХ — на головну">
            <Image
              src="/logo.png"
              alt="Логотип СВІЙ ДЛЯ СВОЇХ"
              width={40}
              height={40}
              priority
              className="w-10 h-10 rounded-full"
            />
            <span className="font-display font-bold text-sm min-[400px]:text-base sm:text-lg leading-tight whitespace-nowrap">
              СВІЙ ДЛЯ СВОЇХ
            </span>
          </Link>

          {/* Desktop меню */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 whitespace-nowrap text-sm lg:text-base">
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
            <Link 
              href="/privacy" 
              className="hidden 2xl:block text-neutral-700 hover:text-primary-600 transition-colors"
            >
              Конфіденційність
            </Link>
          </div>

          {/* Права частина */}
          <div className="flex items-center space-x-2 sm:space-x-4">
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
                  <Link href="/services/create" className="px-3 xl:px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium whitespace-nowrap">
                    + <span className="hidden xl:inline">Створити </span>послугу
                  </Link>
                )}
                {user.accountType !== 'viewer' && (
                  <Link href="/requests/create" className="px-3 xl:px-4 py-2 border border-primary-500 hover:bg-primary-50 text-primary-600 rounded-lg transition-colors font-medium whitespace-nowrap">
                    + <span className="hidden xl:inline">Створити </span>заявку
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
                      <Link
                        href="/profile/edit"
                        className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Редагувати профіль
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
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium whitespace-nowrap"
                >
                  Створити профіль
                </Link>
              </div>
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

            {/* Правова інформація (у мобільному застосунку футер прихований) */}
            <div className="pt-3 mt-3 border-t border-neutral-200 space-y-1">
              <p className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Інформація
              </p>
              <Link
                href="/privacy"
                className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-xl mr-3">🔒</span>
                <span>Політика конфіденційності</span>
              </Link>
              <Link
                href="/terms-of-use"
                className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-xl mr-3">📄</span>
                <span>Умови використання</span>
              </Link>
              <Link
                href="/account-deletion"
                className="flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-xl mr-3">🗑️</span>
                <span>Видалення акаунта</span>
              </Link>
            </div>

            {/* Авторизація / Вихід */}
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
