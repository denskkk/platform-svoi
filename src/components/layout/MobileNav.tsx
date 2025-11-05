'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, MessageCircle, User, UserPlus, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { AccountTypeBadge } from '@/components/ui/AccountTypeBadge'

const navItems = [
  { href: '/', icon: Home, label: 'Головна' },
  { href: '/catalog', icon: Search, label: 'Пошук' },
  { href: '/chat', icon: MessageCircle, label: 'Повідомлення' },
  { href: '/profile', icon: User, label: 'Профіль' },
]

export function MobileNav() {
  const pathname = usePathname()
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
        let token: string | null = null
        try { token = localStorage.getItem('token') } catch {}
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch('/api/auth/me', { credentials: 'include', headers })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          try { localStorage.setItem('user', JSON.stringify(data.user)) } catch {}
        } else {
          setUser(null)
        }
      } catch { /* noop */ }
      finally { setLoading(false) }
    }

    readLocal()
    verify()
  }, [])

  // Поки йде перевірка — показуємо звичну навігацію, аби уникнути стрибків
  const isAuthed = !!user

  if (loading) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-lg">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <div key={item.href} className={cn('flex flex-col items-center justify-center space-y-1', isActive ? 'text-primary-600' : 'text-neutral-300')}>
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-lg">
        <div className="grid grid-cols-2 h-16">
          <Link
            href="/auth/register"
            className={cn('flex flex-col items-center justify-center space-y-1 text-white bg-primary-500 hover:bg-primary-600 transition-colors')}
          >
            <UserPlus className="w-6 h-6" />
            <span className="text-xs font-semibold">Створити профіль</span>
          </Link>
          <Link
            href="/catalog"
            className={cn('flex flex-col items-center justify-center space-y-1 text-neutral-700 hover:text-primary-600')}
          >
            <Eye className="w-6 h-6" />
            <span className="text-xs font-medium">Зайти як глядач</span>
          </Link>
        </div>
      </nav>
    )
  }

  // Авторизованим — стандартні 4 пункти
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-lg">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 transition-colors',
                isActive ? 'text-primary-600' : 'text-neutral-500 hover:text-primary-500'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
