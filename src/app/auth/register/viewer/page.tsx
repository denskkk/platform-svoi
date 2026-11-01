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
import { ConsentCheckbox } from '@/components/ui/ConsentCheckbox';
import { useI18n } from '@/i18n/client';
import { localizedPath } from '@/i18n/routes';

function ViewerRegisterForm() {
  const { t, locale } = useI18n();
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
  const [consent, setConsent] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('registerViewer.errors.fileTooLarge'));
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
      setError(t('registerViewer.errors.requiredFields'));
      return;
    }

    // Валідація паролів
    if (formData.password !== formData.confirmPassword) {
      setError(t('registerViewer.errors.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('registerViewer.errors.passwordTooShort'));
      return;
    }

    if (!consent) {
      setError(t('registerViewer.errors.consentRequired'));
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
          accountType: 'viewer',
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
        throw new Error(data.error || t('registerViewer.errors.registrationFailed'));
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
          {t('registerViewer.backToTypeSelection')}
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <Link href={localizedPath('/', locale)} className="text-3xl font-bold text-blue-600 mb-4 inline-block">
            {t('registerViewer.brand')}
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('registerViewer.title')}
          </h2>
          <p className="text-gray-600">
            {t('registerViewer.subtitle')}
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
                {t('registerViewer.avatar.label')}
              </label>
              <div className="relative">
                {avatarPreview ? (
                  <div className="relative w-32 h-32">
                    <Image
                      src={avatarPreview}
                      alt={t('registerViewer.avatar.previewAlt')}
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
                    <span className="text-xs text-gray-500 text-center px-2">{t('registerViewer.avatar.upload')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">{t('registerViewer.avatar.maxSize')}</p>
            </div>

            {/* Ім'я та Прізвище */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('registerViewer.fields.firstName')}
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
                    placeholder={t('registerViewer.fields.firstNamePlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('registerViewer.fields.lastName')}
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
                    placeholder={t('registerViewer.fields.lastNamePlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('registerViewer.fields.email')}
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
                  placeholder={t('registerViewer.fields.emailPlaceholder')}
                />
              </div>
            </div>

            {/* Телефон */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('registerViewer.fields.phone')}
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
                  placeholder={t('registerViewer.fields.phonePlaceholder')}
                />
              </div>
            </div>

            {/* Місто */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                {t('registerViewer.fields.city')}
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
                  placeholder={t('registerViewer.fields.cityPlaceholder')}
                />
              </div>
            </div>

            {/* Пароль */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('registerViewer.fields.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('registerViewer.fields.passwordPlaceholder')}
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
                {t('registerViewer.fields.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('registerViewer.fields.confirmPasswordPlaceholder')}
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
                {t('registerViewer.social.title')}
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

            {/* Згода з умовами */}
            <div className="mt-6">
              <ConsentCheckbox checked={consent} onChange={setConsent} />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {loading ? t('registerViewer.submitting') : t('registerViewer.submit')}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              {t('registerViewer.providerPrompt')}{' '}
              <Link href="/auth/register/individual" className="text-blue-600 hover:text-blue-700 font-semibold">
                {t('registerViewer.providerLink')}
              </Link>
            </p>
          </div>

          {/* Login Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {t('registerViewer.loginPrompt')}{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                {t('registerViewer.loginLink')}
              </Link>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">{t('registerViewer.benefits.title')}</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>{t('registerViewer.benefits.search')}</li>
            <li>{t('registerViewer.benefits.reviews')}</li>
            <li>{t('registerViewer.benefits.saved')}</li>
            <li>{t('registerViewer.benefits.upgrade')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ViewerRegistrationPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">{t('registerViewer.loading')}</div>}>
      <ViewerRegisterForm />
    </Suspense>
  );
}

