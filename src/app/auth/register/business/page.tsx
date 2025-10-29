'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, MapPin, Phone, Eye, EyeOff, Building2, Briefcase } from 'lucide-react'
import { cities } from '@/lib/constants'

export default function RegisterBusinessPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    companyName: '',
    position: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Валідація паролів
    if (formData.password !== formData.confirmPassword) {
      setError('Паролі не співпадають')
      return
    }

    if (formData.password.length < 8) {
      setError('Пароль має бути мінімум 8 символів')
      return
    }

    setLoading(true)

    try {
      // Розділити ім'я на firstName та lastName
      const nameParts = formData.name.trim().split(' ')
      const firstName = nameParts[0] || formData.name
      const lastName = nameParts.slice(1).join(' ') || 'Business'

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          city: formData.city,
          role: 'business',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Помилка реєстрації')
      }

      // Зберегти токен та дані користувача
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Перейти на бізнес-анкету
      router.push('/auth/business-questionnaire')
    } catch (err: any) {
      setError(err.message || 'Помилка реєстрації')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">С</span>
            </div>
            <span className="font-display font-bold text-xl">СВІЙ ДЛЯ СВОЇХ</span>
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            🏢 Бізнес-профіль
          </h1>
          <p className="text-neutral-600">
            Створи профіль для своєї компанії або підприємства
          </p>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Ім'я представника */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                Ваше ім&apos;я (представника компанії)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="Наприклад: Олександр Петренко"
                />
              </div>
            </div>

            {/* Назва компанії */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-neutral-700 mb-2">
                Назва компанії (необов&apos;язково)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="ТОВ 'Будівельна компанія'"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">Можете дозаповнити пізніше в анкеті</p>
            </div>

            {/* Посада */}
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-neutral-700 mb-2">
                Ваша посада (необов&apos;язково)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="Директор, Власник, Менеджер..."
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="company@email.com"
                />
              </div>
            </div>

            {/* Телефон */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                Телефон
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="+380 (XX) XXX-XX-XX"
                />
              </div>
            </div>

            {/* Місто */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
                Місто (де працює компанія)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-neutral-400" />
                </div>
                <select
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                >
                  <option value="">Оберіть місто</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="Мінімум 8 символів"
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

            {/* Підтвердження пароля */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Підтвердження пароля
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  placeholder="Повторіть пароль"
                />
              </div>
            </div>

            {/* Кнопка реєстрації */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Реєструємо...' : 'Продовжити'}
            </button>
          </form>

          {/* Додаткова інформація */}
          <div className="mt-6 p-4 bg-accent-50 rounded-lg">
            <p className="text-sm text-neutral-700">
              <strong>Після реєстрації:</strong> Ви зможете дозаповнити детальну інформацію про вашу компанію, послуги, команду та контакти в бізнес-анкеті.
            </p>
          </div>

          {/* Повернутись */}
          <div className="mt-6 text-center">
            <Link href="/auth/register" className="text-sm text-neutral-600 hover:text-neutral-900">
              ← Повернутись до вибору типу профілю
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
