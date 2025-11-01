'use client'

import Link from 'next/link'
import { Search, User, Menu, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          try {
            localStorage.setItem('user', JSON.stringify(data.user))
          } catch {}
        } else {
          // Якщо сесії нема — прибираємо потенційно застарілі localStorage дані
          try {
            localStorage.removeItem('user')
            localStorage.removeItem('token')
          } catch {}
          setUser(null)
        }
      } catch {
        // Не блокуємо UI у випадку помилки мережі
      } finally {
        setIsLoading(false)
      }
    }

    // Initial read with tiny delay to avoid flash, потім валідація на сервері
    const timer = setTimeout(() => {
      readUser()
      syncWithServer()
    }, 100)

    // React to cross-tab/local updates
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') readUser()
    }
    window.addEventListener('storage', onStorage)

    // React to explicit auth change events
    const onAuthChanged = () => readUser()
    window.addEventListener('auth:changed', onAuthChanged as EventListener)

    // Refresh when tab gains focus
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
              Категорії
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
              href="/catalog"
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Пошук"
            >
              <Search className="w-5 h-5 text-neutral-600" />
            </Link>

            {isLoading ? (
              // Показываем загрузку
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-24 h-10 bg-neutral-200 rounded-lg animate-pulse"></div>
                <div className="w-32 h-10 bg-neutral-200 rounded-lg animate-pulse"></div>
              </div>
            ) : user ? (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  href="/services/create"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
                >
                  + Додати послугу
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.firstName} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    <span className="font-medium text-neutral-700">{user.firstName}</span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2">
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
                      <Link
                        href="/messages"
                        className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Повідомлення
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
              Категорії
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
            <div className="pt-2 border-t border-neutral-200">
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
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
