'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth as checkSession } from '@/lib/silentFetch';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';

const CATEGORY_OPTIONS = [
  { value: 'Електрика', labelKey: 'serviceRequests.create.categories.electrics' }, // i18n-ignore
  { value: 'Сантехніка', labelKey: 'serviceRequests.create.categories.plumbing' }, // i18n-ignore
  { value: 'Будівництво', labelKey: 'serviceRequests.create.categories.construction' }, // i18n-ignore
  { value: 'Ремонт', labelKey: 'serviceRequests.create.categories.repair' }, // i18n-ignore
  { value: 'Клінінг', labelKey: 'serviceRequests.create.categories.cleaning' }, // i18n-ignore
  { value: 'Садівництво', labelKey: 'serviceRequests.create.categories.gardening' }, // i18n-ignore
  { value: 'Інше', labelKey: 'serviceRequests.create.categories.other' } // i18n-ignore
];

export default function CreateServiceRequestPage() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    city: '',
    address: '',
    budgetFrom: '',
    budgetTo: '',
    photos: [] as string[]
  });

  // Перевірка авторизації
  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const checkAuth = async () => {
      const session = await checkSession();
      if (cancelled) return;
      if (session.status === 'guest') {
        router.push('/auth/login?redirect=/service-requests/create');
        return;
      }
      if (session.status === 'unavailable') {
        // Немає зв'язку з сервером — це не вихід із акаунта, пробуємо ще раз
        retryTimer = setTimeout(checkAuth, 3000);
        return;
      }

      // Глядачі не можуть створювати заявки
      if ((session.user as { accountType?: string } | undefined)?.accountType === 'viewer') {
        alert(t('serviceRequests.create.viewerBlocked'));
        router.push('/service-requests');
        return;
      }

      setIsAuthorized(true);
    };

    checkAuth();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t('serviceRequests.common.createFailed'));
      }

      const data = await res.json();
      router.push(`/service-requests/${data.request.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Показуємо лоадер під час перевірки авторизації
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('serviceRequests.common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900           mb-2">{t('serviceRequests.common.createRequest')}</h1>
                    <p className="text-gray-600 mb-8">{t('serviceRequests.create.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Назва */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('serviceRequests.create.titleLabel')}
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('serviceRequests.create.titlePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Категорія */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('serviceRequests.create.categoryLabel')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('serviceRequests.create.categoryPlaceholder')}</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>{t(cat.labelKey)}</option>
                ))}
              </select>
            </div>

            {/* Опис */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('serviceRequests.create.descriptionLabel')}
              </label>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('serviceRequests.create.descriptionPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Місто та адреса */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('serviceRequests.create.cityLabel')}
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder={t('serviceRequests.create.cityPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('serviceRequests.create.addressLabel')}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('serviceRequests.create.addressPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Бюджет */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('serviceRequests.create.budgetLabel')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.budgetFrom}
                  onChange={(e) => setFormData({ ...formData, budgetFrom: e.target.value })}
                  placeholder={t('serviceRequests.create.budgetFromPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.budgetTo}
                  onChange={(e) => setFormData({ ...formData, budgetTo: e.target.value })}
                  placeholder={t('serviceRequests.create.budgetToPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                {t('serviceRequests.common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? t('serviceRequests.common.creating') : t('serviceRequests.common.createRequest')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
