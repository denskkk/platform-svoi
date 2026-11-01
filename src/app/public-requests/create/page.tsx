'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, DollarSign, MapPin } from 'lucide-react';
import { useI18n } from '@/i18n/client';

const CATEGORY_OPTIONS = [
  { value: 'Електрика', labelKey: 'serviceRequests.publicCreate.categories.electrics' }, // i18n-ignore
  { value: 'Сантехніка', labelKey: 'serviceRequests.publicCreate.categories.plumbing' }, // i18n-ignore
  { value: 'Будівництво', labelKey: 'serviceRequests.publicCreate.categories.construction' }, // i18n-ignore
  { value: 'Ремонт', labelKey: 'serviceRequests.publicCreate.categories.repair' }, // i18n-ignore
  { value: 'Дизайн', labelKey: 'serviceRequests.publicCreate.categories.design' }, // i18n-ignore
  { value: 'IT послуги', labelKey: 'serviceRequests.publicCreate.categories.it' }, // i18n-ignore
  { value: 'Перевезення', labelKey: 'serviceRequests.publicCreate.categories.transport' }, // i18n-ignore
  { value: 'Прибирання', labelKey: 'serviceRequests.publicCreate.categories.cleaning' }, // i18n-ignore
  { value: 'Інше', labelKey: 'serviceRequests.publicCreate.categories.other' } // i18n-ignore
];

function PublicRequestFormContent() {
  const router = useRouter();
  const { t } = useI18n();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budgetMin: '',
    budgetMax: '',
    city: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(storedUser);
    setCurrentUser(user);
    setFormData(prev => ({ ...prev, city: user.city || '' }));
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category || null,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
        city: formData.city,
        isPublic: true,  // Це публічна заявка
      };

      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('serviceRequests.common.createFailed'));
      }

      // Перенаправити на сторінку публічних заявок з параметром для скидання кешу
      router.push(`/public-requests?refresh=${Date.now()}`);
      router.refresh(); // Додатково примусово оновити
    } catch (err: any) {
      setError(err.message || t('serviceRequests.common.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-neutral-600">{t('serviceRequests.common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Кнопка назад */}
        <Link
          href="/public-requests"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('serviceRequests.publicCreate.back')}
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              {t('serviceRequests.publicCreate.title')}
            </h1>
            <p className="text-neutral-600">
              {t('serviceRequests.publicCreate.subtitle')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Назва */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('serviceRequests.publicCreate.titleLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                required
                maxLength={200}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('serviceRequests.publicCreate.titlePlaceholder')}
              />
            </div>

            {/* Категорія */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('serviceRequests.publicCreate.categoryLabel')}
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('serviceRequests.publicCreate.categoryPlaceholder')}</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>{t(cat.labelKey)}</option>
                ))}
              </select>
            </div>

            {/* Опис */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('serviceRequests.publicCreate.descriptionLabel')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('serviceRequests.publicCreate.descriptionPlaceholder')}
              />
            </div>

            {/* Бюджет */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="budgetMin" className="block text-sm font-medium text-neutral-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  {t('serviceRequests.publicCreate.budgetFromLabel')}
                </label>
                <input
                  type="number"
                  id="budgetMin"
                  min="0"
                  step="0.01"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="500"
                />
              </div>
              <div>
                <label htmlFor="budgetMax" className="block text-sm font-medium text-neutral-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  {t('serviceRequests.publicCreate.budgetToLabel')}
                </label>
                <input
                  type="number"
                  id="budgetMax"
                  min="0"
                  step="0.01"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2000"
                />
              </div>
            </div>

            {/* Місто */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('serviceRequests.publicCreate.cityLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('serviceRequests.publicCreate.cityPlaceholder')}
              />
            </div>

            {/* Кнопки */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/public-requests')}
                className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                {t('serviceRequests.common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {submitting ? t('serviceRequests.common.creating') : t('serviceRequests.common.createRequest')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PublicRequestCreatePage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-neutral-600">{t('serviceRequests.common.loading')}</div>
      </div>
    }>
      <PublicRequestFormContent />
    </Suspense>
  );
}
