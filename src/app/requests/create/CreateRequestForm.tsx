'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function CreateRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceId');
  const executorId = searchParams.get('executorId');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [serviceMissing, setServiceMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
    city: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    
    const user = JSON.parse(storedUser);
    setCurrentUser(user);
    setFormData(prev => ({ ...prev, city: user.city || '' }));

    if (serviceId) {
      loadService();
    } else {
      setLoading(false);
    }
  }, [serviceId]);

  const loadService = async () => {
    try {
      const response = await fetch(`/api/services/${serviceId}`);
      if (!response.ok) {
        setServiceMissing(true);
        return;
      }
      const data = await response.json();
      if (data?.service) {
        setService(data.service);
        setFormData(prev => ({
          ...prev,
          title: `Заявка на "${data.service.title}"`,
          description: `Мені потрібна послуга: ${data.service.title}`,
          budgetMin: data.service.priceFrom?.toString() || '',
          budgetMax: data.service.priceTo?.toString() || '',
          city: data.service.city || prev.city,
        }));
      } else {
        setServiceMissing(true);
      }
    } catch (err) {
      console.error('Помилка завантаження послуги:', err);
      setServiceMissing(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      router.push('/login');
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

      const payload: any = {
        title: formData.title,
        description: formData.description,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
        city: formData.city,
      };

      if (serviceId && !serviceMissing) {
        payload.serviceId = parseInt(serviceId);
        // executorId буде автоматично взятий з послуги на сервері
      }

      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка створення заявки');
      }

      // Перенаправить на страницу заявки
      router.push(`/service-requests/${data.request.id}`);
    } catch (err: any) {
      setError(err.message || 'Помилка створення заявки');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Кнопка назад */}
        <Link
          href={serviceId ? `/services/${serviceId}` : '/service-requests'}
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-6">
            Подати заявку
          </h1>
          {serviceMissing && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">Обрана послуга недоступна або видалена. Ви можете все одно створити загальну заявку без привʼязки до цієї послуги.</p>
            </div>
          )}
          {service && !serviceMissing && (
            <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-sm text-primary-800">
                Ви подаєте заявку на послугу: <strong>{service.title}</strong>
              </p>
              <p className="text-sm text-primary-700 mt-1">
                Виконавець: {service.user?.businessInfo?.companyName || `${service.user.firstName} ${service.user.lastName}`}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Заголовок */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-2">
                Назва заявки <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Наприклад: Потрібен електрик для ремонту проводки"
              />
            </div>

            {/* Опис */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
                Опис заявки <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Опишіть детально, що вам потрібно..."
              />
            </div>

            {/* Бюджет */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="budgetMin" className="block text-sm font-medium text-neutral-700 mb-2">
                  Бюджет від (грн)
                </label>
                <input
                  type="number"
                  id="budgetMin"
                  min="0"
                  step="0.01"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="500"
                />
              </div>
              <div>
                <label htmlFor="budgetMax" className="block text-sm font-medium text-neutral-700 mb-2">
                  Бюджет до (грн)
                </label>
                <input
                  type="number"
                  id="budgetMax"
                  min="0"
                  step="0.01"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="2000"
                />
              </div>
            </div>

            {/* Місто */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
                Місто <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Київ"
              />
            </div>

            {/* Кнопки */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Створення...' : 'Подати заявку'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
