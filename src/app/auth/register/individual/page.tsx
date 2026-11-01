'use client'

import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, MapPin, Phone, Eye, EyeOff, ArrowLeft, Upload, X, Facebook, Instagram, Send } from 'lucide-react'
import { cities, getCityName } from '@/lib/constants'
import Image from 'next/image'
import { ConsentCheckbox } from '@/components/ui/ConsentCheckbox'
import { useI18n } from '@/i18n/client'
import { localizedPath } from '@/i18n/routes'

function RegisterIndividualForm() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    instagram: '',
    facebook: '',
    telegram: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [consent, setConsent] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('registerIndividual.errors.fileTooLarge'))
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Валідація обов'язкових полів
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError(t('registerIndividual.errors.requiredFields'))
      return
    }

    // Валідація паролів
    if (formData.password !== formData.confirmPassword) {
      setError(t('registerIndividual.errors.passwordMismatch'))
      return
    }

    if (formData.password.length < 6) {
      setError(t('registerIndividual.errors.passwordTooShort'))
      return
    }

    if (!consent) {
      setError(t('registerIndividual.errors.consentRequired'))
      return
    }

    setLoading(true)

    try {
      // Конвертуємо аватар в base64 якщо є
      let avatarBase64 = null
      if (avatarFile) {
        avatarBase64 = avatarPreview // вже є base64 з FileReader
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
          city: formData.city || undefined,
          role: 'user',
          accountType: 'basic',
          avatarBase64: avatarBase64,
          socialLinks: {
            instagram: formData.instagram.trim() || undefined,
            facebook: formData.facebook.trim() || undefined,
            telegram: formData.telegram.trim() || undefined,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('registerIndividual.errors.registrationFailed'))
      }

      // Зберегти токен та дані користувача
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Перейти на анкету для заповнення детального профілю
      router.push('/auth/questionnaire')
    } catch (err: any) {
      setError(err.message || t('registerIndividual.errors.registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link
          href="/auth/register"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('registerIndividual.backToTypeSelection')}
        </Link>

        {/* Заголовок */}
        <div className="text-center mb-8">
          <Link href={localizedPath('/', locale)} className="inline-flex items-center space-x-2 mb-6">
            <Image src="/logo.png" alt={t('registerIndividual.logoAlt')} width={48} height={48} className="w-12 h-12 rounded-full" />
            <span className="font-display font-bold text-xl">{t('registerIndividual.brand')}</span>
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {t('registerIndividual.title')}
          </h1>
          <p className="text-neutral-600">
            {t('registerIndividual.subtitle')}
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
            {/* Аватар */}
            <div className="flex flex-col items-center mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                {t('registerIndividual.avatar.label')}
              </label>
              <div className="relative">
                {avatarPreview ? (
                  <div className="relative w-32 h-32">
                    <Image
                      src={avatarPreview}
                      alt={t('registerIndividual.avatar.previewAlt')}
                      fill
                      className="rounded-full object-cover border-4 border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-full cursor-pointer hover:border-primary-500 transition-colors bg-neutral-50">
                    <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                    <span className="text-xs text-neutral-500 text-center px-2">{t('registerIndividual.avatar.upload')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-2">{t('registerIndividual.avatar.maxSize')}</p>
            </div>

            {/* Ім'я та Прізвище */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('registerIndividual.fields.firstName')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('registerIndividual.fields.firstNamePlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('registerIndividual.fields.lastName')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('registerIndividual.fields.lastNamePlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('registerIndividual.fields.email')}
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
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={t('registerIndividual.fields.emailPlaceholder')}
                />
              </div>
            </div>

            {/* Телефон */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('registerIndividual.fields.phone')}
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
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={t('registerIndividual.fields.phonePlaceholder')}
                />
              </div>
            </div>

            {/* Місто */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('registerIndividual.fields.city')}
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
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{t('registerIndividual.fields.cityPlaceholder')}</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{getCityName(city, locale)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Пароль */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('registerIndividual.fields.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={t('registerIndividual.fields.passwordPlaceholder')}
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
                {t('registerIndividual.fields.confirmPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="block w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={t('registerIndividual.fields.confirmPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Соціальні мережі */}
            <div className="border-t border-gray-200 pt-5 mt-5">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                {t('registerIndividual.social.title')}
              </h3>
              
              <div className="space-y-4">
                {/* Instagram */}
                <div>
                  <label htmlFor="instagram" className="block text-sm font-medium text-neutral-700 mb-2">
                    Instagram
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Instagram className="h-5 w-5 text-pink-500" />
                    </div>
                    <input
                      id="instagram"
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="@username"
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div>
                  <label htmlFor="facebook" className="block text-sm font-medium text-neutral-700 mb-2">
                    Facebook
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Facebook className="h-5 w-5 text-blue-600" />
                    </div>
                    <input
                      id="facebook"
                      type="text"
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="facebook.com/username"
                    />
                  </div>
                </div>

                {/* Telegram */}
                <div>
                  <label htmlFor="telegram" className="block text-sm font-medium text-neutral-700 mb-2">
                    Telegram
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Send className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      id="telegram"
                      type="text"
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                      className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Згода з умовами */}
            <div className="mt-6">
              <ConsentCheckbox checked={consent} onChange={setConsent} />
            </div>

            {/* Кнопка реєстрації */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? t('registerIndividual.submitting') : t('registerIndividual.submit')}
            </button>
          </form>
          

          {/* Додаткова інформація */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              {t('registerIndividual.businessPrompt')}{' '}
              <Link href="/auth/register/business" className="text-primary-600 hover:text-primary-700 font-semibold">
                {t('registerIndividual.businessLink')}
              </Link>
            </p>
          </div>

          {/* Вхід */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {t('registerIndividual.loginPrompt')}{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                {t('registerIndividual.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterIndividualPage() {
  const { t } = useI18n()
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{t('registerIndividual.loading')}</div>}>
      <RegisterIndividualForm />
    </Suspense>
  )
}
