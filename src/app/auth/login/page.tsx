'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveUser, saveToken } from '@/lib/client-auth'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Помилка входу')
      }
      // Зберегти користувача та токен для клієнта
      if (data.user) saveUser(data.user)
      if (data.token) saveToken(data.token)
      // Повідомити інші компоненти про зміну авторизації
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:changed'))
      }
      
      // Якщо користувач адміністратор - перехід на адмін-панель
      if (data.user?.isAdmin) {
        router.push('/admin')
      } else {
        // Звичайний користувач - на профіль
        const target = data?.user?.id ? `/profile/${data.user.id}` : '/catalog'
        router.push(target)
      }
    } catch (err: any) {
      setError(err.message || 'Не вдалося увійти')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Логотип */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <img src="/sitelogo.png" alt="Логотип" className="w-12 h-12 object-contain" />
            <span className="font-display font-bold text-xl">СВІЙ ДЛЯ СВОЇХ</span>
          </Link>
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">
            Вітаємо знову!
          </h2>
          <p className="text-neutral-600">
            Увійдіть, щоб продовжити роботу
          </p>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email або телефон
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {/* Пароль */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Запам'ятати мене */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-neutral-700">
                  Запам&apos;ятати мене
                </label>
              </div>
              <Link
                href="/contacts"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Потрібна допомога?
              </Link>
            </div>

            {/* Кнопка входу */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Входимо...' : 'Увійти'}
            </button>
          </form>

          {/* Реєстрація */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Ще не маєте профілю?{' '}
              <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Створити профіль
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
