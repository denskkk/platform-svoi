/**
 * Сторінка реєстрації для глядачів (споживачів послуг)
 */

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User, Mail, Lock, MapPin, Phone, ArrowLeft, Upload, X, Facebook, Instagram, Send } from 'lucide-react';
import { saveUser, saveToken } from '@/lib/client-auth';
import Image from 'next/image';

function ViewerRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    instagram: '',
    facebook: '',
    telegram: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Файл занадто великий. Максимум 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Валідація обов'язкових полів
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError('Заповніть всі обов\'язкові поля');
      return;
    }

    // Валідація паролів
    if (formData.password !== formData.confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль має містити мінімум 6 символів');
      return;
    }

    setLoading(true);

    try {
      // Конвертуємо аватар в base64 якщо є
      let avatarBase64 = null;
      if (avatarFile) {
        avatarBase64 = avatarPreview; // вже є base64 з FileReader
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
          password: formData.password,
          phone: formData.phone.trim() || undefined,
          city: formData.city.trim() || undefined,
          role: 'user',
          accountType: 'basic',
          ref: searchParams?.get('ref') || undefined,
          avatarBase64: avatarBase64,
          socialLinks: {
            instagram: formData.instagram.trim() || undefined,
            facebook: formData.facebook.trim() || undefined,
            telegram: formData.telegram.trim() || undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка реєстрації');
      }

      // Зберегти дані користувача та токен
      if (data.user) {
        saveUser(data.user);
      }
      if (data.token) {
        saveToken(data.token);
      }

      // Перенаправити на каталог послуг
      router.push('/catalog');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <Link
          href="/auth/register"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад до вибору типу
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600 mb-4 inline-block">
            Свій для Своїх
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            👁️ Реєстрація Глядача
          </h2>
          <p className="text-gray-600">
            Швидка реєстрація для пошуку та замовлення послуг
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Аватар */}
            <div className="flex flex-col items-center mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Фото профілю (необов&apos;язково)
              </label>
              <div className="relative">
                {avatarPreview ? (
                  <div className="relative w-32 h-32">
                    <Image
                      src={avatarPreview}
                      alt="Avatar preview"
                      fill
                      className="rounded-full object-cover border-4 border-blue-500"
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
                  <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-blue-500 transition-colors bg-gray-50">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500 text-center px-2">Завантажити фото</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Макс. 5MB</p>
            </div>

            {/* Ім'я та Прізвище */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Ім&apos;я *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Іван"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Прізвище *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Іваненко"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ivan@example.com"
                />
              </div>
            </div>

            {/* Телефон */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+38 (050) 123-45-67"
                />
              </div>
            </div>

            {/* Місто */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Місто
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Київ"
                />
              </div>
            </div>

            {/* Пароль */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Пароль *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Мінімум 6 символів"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Підтвердження паролю */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Підтвердіть пароль *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Повторіть пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Соціальні мережі */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-md font-semibold text-gray-900 mb-3">
                Соціальні мережі (необов&apos;язково)
              </h3>
              
              <div className="space-y-3">
                {/* Instagram */}
                <div>
                  <label htmlFor="instagram" className="block text-xs font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-500" />
                    <input
                      id="instagram"
                      name="instagram"
                      type="text"
                      value={formData.instagram}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@username"
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div>
                  <label htmlFor="facebook" className="block text-xs font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-600" />
                    <input
                      id="facebook"
                      name="facebook"
                      type="text"
                      value={formData.facebook}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="facebook.com/username"
                    />
                  </div>
                </div>

                {/* Telegram */}
                <div>
                  <label htmlFor="telegram" className="block text-xs font-medium text-gray-700 mb-1">
                    Telegram
                  </label>
                  <div className="relative">
                    <Send className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <input
                      id="telegram"
                      name="telegram"
                      type="text"
                      value={formData.telegram}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {loading ? 'Реєстрація...' : '🚀 Зареєструватися'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Хочете надавати послуги?{' '}
              <Link href="/auth/register/individual" className="text-blue-600 hover:text-blue-700 font-semibold">
                Реєструйтесь як Виконавець
              </Link>
            </p>
          </div>

          {/* Login Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Вже є акаунт?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Увійти
              </Link>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Переваги акаунту Глядача:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Швидкий пошук перевірених послуг</li>
            <li>✓ Перегляд рейтингів та відгуків</li>
            <li>✓ Збереження обраних постачальників</li>
            <li>✓ Пряме спілкування з виконавцями</li>
            <li>✓ Можливість залишати відгуки</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ViewerRegistrationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">Завантаження...</div>}>
      <ViewerRegisterForm />
    </Suspense>
  );
}

