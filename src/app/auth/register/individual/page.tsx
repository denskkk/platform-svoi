'use client'

import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, MapPin, Phone, Eye, EyeOff } from 'lucide-react'
import { cities } from '@/lib/constants'

function RegisterIndividualForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [telegram, setTelegram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [showExtended, setShowExtended] = useState(false)
  const [educationLevel, setEducationLevel] = useState('')
  const [gender, setGender] = useState('')
  const [employmentStatusField, setEmploymentStatusField] = useState('')
  const [bio, setBio] = useState('')
  const [siteUsageGoal, setSiteUsageGoal] = useState('')
  const [extended, setExtended] = useState({
    educationDetails: '',
    ucmMember: '',
    ucmSupporter: '',
    workplace: '',
    profession: '',
    seekingPartTime: false,
    seekingFullTime: false,
    seekingSpecialty: '',
    wantsStartBusiness: '',
    businessType: '',
    fopGroup: '',
    tovType: '',
    companyCode: '',
    businessCategory: '',
    offerType: '',
    usesBusinessServices: [] as string[],
    readyToSwitchToUCM: '',
    workHistory: '',
    hasChildren: '',
    childrenCount: '',
    childrenAges: [] as string[],
    hasPets: '',
    petsInfo: '',
    housingType: '',
    housingDetails: [] as string[],
    usesHomeServices: [] as string[],
    hasCar: '',
    carInfo: '',
    usesTaxi: false,
    carServices: [] as string[],
    hasBicycle: '',
    bicycleInfo: '',
    usesDelivery: '',
    restaurantFrequency: '',
    cuisinePreference: '',
    outdoorActivities: [] as string[],
    sports: '',
    beautyServices: [] as string[],
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
      const lastName = nameParts.slice(1).join(' ') || 'User'

      // Аватар и соцсети остаются опциональными при регистрации.
      // Пользователь сможет добавить или изменить их позже в разделе редактирования профиля.

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
          role: 'user',
          ref: searchParams?.get('ref') || undefined,
          // We don't send avatarFile here (needs upload after we get token),
          // but send social links if provided so they can be stored immediately.
          socialLinks: (instagram || facebook || telegram || tiktok) ? {
            ...(instagram ? { instagram } : {}),
            ...(facebook ? { facebook } : {}),
            ...(telegram ? { telegram } : {}),
            ...(tiktok ? { tiktok } : {}),
          } : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Помилка реєстрації')
      }

      // Зберегти токен та дані користувача
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Обновим профиль: загрузим аватар (если есть) и отправим соцсети + расширенные поля
      try {
        let avatarUrl: string | undefined = undefined

        if (avatarFile) {
          const fd = new FormData()
          fd.append('file', avatarFile)
          fd.append('type', 'avatars')
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${data.token}`,
            },
            body: fd,
          })
          const uploadData = await uploadRes.json()
          if (uploadRes.ok && uploadData.url) {
            avatarUrl = uploadData.url
          } else {
            console.warn('Avatar upload failed or returned no url', uploadData)
          }
        }

        // Собираем body для обновления профиля (включая расширенные поля, если заполнены)
        const profileUpdateBody: any = {}
        if (avatarUrl) profileUpdateBody.avatarUrl = avatarUrl
        const socialObj: any = {}
        if (instagram) socialObj.instagram = instagram
        if (facebook) socialObj.facebook = facebook
        if (telegram) socialObj.telegram = telegram
        if (tiktok) socialObj.tiktok = tiktok
        if (Object.keys(socialObj).length) profileUpdateBody.socialLinks = socialObj

        // Базовые поля анкеты (заполняем только если есть данные)
        if (educationLevel) profileUpdateBody.educationLevel = educationLevel
        if (gender) profileUpdateBody.gender = gender
        if (employmentStatusField) profileUpdateBody.employmentStatus = employmentStatusField
        if (bio) profileUpdateBody.bio = bio
        if (siteUsageGoal) profileUpdateBody.siteUsageGoal = siteUsageGoal.split(',').map(s => s.trim()).filter(Boolean)

        // Если пользователь выбрал заполнить расширенную анкету при регистрации,
        // добавляем все соответствующие поля из `extended`.
        if (showExtended) {
          const ext = extended
          if (ext.educationDetails) profileUpdateBody.educationDetails = ext.educationDetails
          if (ext.ucmMember !== undefined && ext.ucmMember !== '') profileUpdateBody.ucmMember = ext.ucmMember
          if (ext.ucmSupporter !== undefined && ext.ucmSupporter !== '') profileUpdateBody.ucmSupporter = ext.ucmSupporter
          if (ext.workplace) profileUpdateBody.workplace = ext.workplace
          if (ext.profession) profileUpdateBody.profession = ext.profession
          if (ext.seekingPartTime !== undefined) profileUpdateBody.seekingPartTime = ext.seekingPartTime
          if (ext.seekingFullTime !== undefined) profileUpdateBody.seekingFullTime = ext.seekingFullTime
          if (ext.seekingSpecialty) profileUpdateBody.seekingSpecialty = ext.seekingSpecialty
          if (ext.wantsStartBusiness !== undefined) profileUpdateBody.wantsStartBusiness = ext.wantsStartBusiness
          if (ext.businessType) profileUpdateBody.businessType = ext.businessType
          if (ext.fopGroup) profileUpdateBody.fopGroup = ext.fopGroup
          if (ext.tovType) profileUpdateBody.tovType = ext.tovType
          if (ext.companyCode) profileUpdateBody.companyCode = ext.companyCode
          if (ext.businessCategory) profileUpdateBody.businessCategory = ext.businessCategory
          if (ext.offerType) profileUpdateBody.offerType = ext.offerType
          if (ext.usesBusinessServices && ext.usesBusinessServices.length) profileUpdateBody.usesBusinessServices = ext.usesBusinessServices
          if (ext.readyToSwitchToUCM) profileUpdateBody.readyToSwitchToUCM = ext.readyToSwitchToUCM
          if (ext.workHistory) profileUpdateBody.workHistory = ext.workHistory
          if (ext.hasChildren) profileUpdateBody.hasChildren = ext.hasChildren
          if (ext.childrenCount) profileUpdateBody.childrenCount = ext.childrenCount
          if (ext.childrenAges && ext.childrenAges.length) profileUpdateBody.childrenAges = ext.childrenAges
          if (ext.hasPets !== undefined && ext.hasPets !== '') profileUpdateBody.hasPets = ext.hasPets
          if (ext.petsInfo) profileUpdateBody.petsInfo = ext.petsInfo
          if (ext.housingType) profileUpdateBody.housingType = ext.housingType
          if (ext.housingDetails && ext.housingDetails.length) profileUpdateBody.housingDetails = ext.housingDetails
          if (ext.usesHomeServices && ext.usesHomeServices.length) profileUpdateBody.usesHomeServices = ext.usesHomeServices
          if (ext.hasCar !== undefined && ext.hasCar !== '') profileUpdateBody.hasCar = ext.hasCar
          if (ext.carInfo) profileUpdateBody.carInfo = ext.carInfo
          if (ext.usesTaxi !== undefined) profileUpdateBody.usesTaxi = ext.usesTaxi
          if (ext.carServices && ext.carServices.length) profileUpdateBody.carServices = ext.carServices
          if (ext.hasBicycle) profileUpdateBody.hasBicycle = ext.hasBicycle
          if (ext.bicycleInfo) profileUpdateBody.bicycleInfo = ext.bicycleInfo
          if (ext.usesDelivery) profileUpdateBody.usesDelivery = ext.usesDelivery
          if (ext.restaurantFrequency) profileUpdateBody.restaurantFrequency = ext.restaurantFrequency
          if (ext.cuisinePreference) profileUpdateBody.cuisinePreference = ext.cuisinePreference
          if (ext.outdoorActivities && ext.outdoorActivities.length) profileUpdateBody.outdoorActivities = ext.outdoorActivities
          if (ext.sports) profileUpdateBody.sports = ext.sports
          if (ext.beautyServices && ext.beautyServices.length) profileUpdateBody.beautyServices = ext.beautyServices
        }

        // Всегда отправляем хотя бы пустой объект, сервер корректно обработает null-поля
        const profileRes = await fetch(`/api/profile/${data.user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`,
          },
          body: JSON.stringify(profileUpdateBody),
        })

        if (profileRes.ok) {
          try {
            const profileJson = await profileRes.json()
            if (profileJson && profileJson.user) {
              localStorage.setItem('user', JSON.stringify(profileJson.user))
            }
          } catch (e) {
            // ignore parse errors
          }
        } else {
          console.warn('Profile update after registration failed')
        }
      } catch (e) {
        console.warn('Profile update failed after registration', e)
      }

      // Перейти на анкету
      router.push('/auth/questionnaire')
    } catch (err: any) {
      setError(err.message || 'Помилка реєстрації')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
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
            👤 Звичайний профіль
          </h1>
          <p className="text-neutral-600">
            Створи профіль і почни пропонувати свої послуги
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
            {/* Ім'я */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                Як тебе звати?
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
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Наприклад: Олександр"
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
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="example@email.com"
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
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+380 (XX) XXX-XX-XX"
                />
              </div>
            </div>

            {/* Місто */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
                Де живеш?
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
                  <option value="">Обери місто</option>
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
                  className="block w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Повтори пароль"
                />
              </div>
            </div>

            {/* Кнопка реєстрації */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Реєструємо...' : 'Продовжити'}
            </button>
          </form>
          {/* Avatar + socials (optional at registration) */}
          <div className="mt-6 border-t pt-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Аватар (опціонально)</label>
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <input
                type="text"
                placeholder="Instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Facebook"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Telegram"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="TikTok"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="mt-4">
              <label className="inline-flex items-center text-sm">
                <input type="checkbox" className="mr-2" checked={showExtended} onChange={() => setShowExtended(!showExtended)} />
                Заповнити розширену анкету під час реєстрації
              </label>
            </div>

            {showExtended && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-700 mb-1">Освіта</label>
                    <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">Оберіть</option>
                      <option value="secondary">Середня</option>
                      <option value="college">Коледж</option>
                      <option value="bachelor">Бакалавр</option>
                      <option value="master">Магістр</option>
                      <option value="doctorate">Аспірантура</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-700 mb-1">Деталі освіти</label>
                    <input value={extended.educationDetails} onChange={(e) => setExtended({ ...extended, educationDetails: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-700 mb-1">Стать</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">Оберіть</option>
                      <option value="male">Чоловік</option>
                      <option value="female">Жінка</option>
                      <option value="other">Інше</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-700 mb-1">Статус працевлаштування</label>
                    <select value={employmentStatusField} onChange={(e) => setEmploymentStatusField(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">Оберіть</option>
                      <option value="employed">Працевлаштований</option>
                      <option value="unemployed">Безробітний</option>
                      <option value="business_owner">Власник бізнесу</option>
                      <option value="freelancer">Фрілансер</option>
                      <option value="student">Студент</option>
                      <option value="retired">Пенсіонер</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-700 mb-1">Професія</label>
                  <input value={extended.profession} onChange={(e) => setExtended({ ...extended, profession: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm text-neutral-700 mb-1">Про себе</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-700 mb-1">Наявність дітей</label>
                    <select value={extended.hasChildren} onChange={(e) => setExtended({ ...extended, hasChildren: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">Оберіть</option>
                      <option value="Так">Так</option>
                      <option value="Ні">Ні</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-700 mb-1">Кількість дітей</label>
                    <select value={extended.childrenCount} onChange={(e) => setExtended({ ...extended, childrenCount: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">Оберіть</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="more">Більше</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-700 mb-1">Наявність авто</label>
                    <select value={extended.hasCar} onChange={(e) => setExtended({ ...extended, hasCar: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">Оберіть</option>
                      <option value="Так">Так</option>
                      <option value="Ні">Ні</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-neutral-700 mb-1">Користування доставкою</label>
                    <select value={extended.usesDelivery} onChange={(e) => setExtended({ ...extended, usesDelivery: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">Оберіть</option>
                      <option value="use">Користуюсь</option>
                      <option value="want_to_try">Хочу спробувати</option>
                      <option value="not_interested">Не цікаво</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-700 mb-1">Мета використання сайту (через кому)</label>
                  <input value={siteUsageGoal} onChange={(e) => setSiteUsageGoal(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Наприклад: ease_life, support_team" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-700 mb-1">Соцмережі - Instagram</label>
                    <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-700 mb-1">Telegram</label>
                    <input value={telegram} onChange={(e) => setTelegram(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
              </div>
            )}
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

export default function RegisterIndividualPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Завантаження...</div>}>
      <RegisterIndividualForm />
    </Suspense>
  )
}
