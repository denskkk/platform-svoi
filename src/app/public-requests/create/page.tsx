'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, DollarSign, MapPin } from 'lucide-react';

function PublicRequestFormContent() {
  const router = useRouter();
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
    isPromoted: false,
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
    setLoading(false);
  }, []);

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

      const totalCost = formData.isPromoted ? 7 : 5;
      
      if (Number(currentUser.balanceUcm) < totalCost) {
        throw new Error(`Недостатньо коштів. Потрібно ${totalCost} UCM (ваш баланс: ${currentUser.balanceUcm} UCM)`);
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category || null,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
        city: formData.city,
        isPublic: true,  // Це публічна заявка
        isPromoted: formData.isPromoted,
      };

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

      // Оновити баланс користувача
      const updatedUser = { ...currentUser, balanceUcm: Number(currentUser.balanceUcm) - totalCost };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Перенаправити на сторінку публічних заявок
      router.push('/public-requests');
    } catch (err: any) {
      setError(err.message || 'Помилка створення заявки');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-neutral-600">Завантаження...</div>
      </div>
    );
  }

  const totalCost = formData.isPromoted ? 7 : 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Кнопка назад */}
        <Link
          href="/public-requests"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад до заявок
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Створити публічну заявку
            </h1>
            <p className="text-neutral-600">
              Опишіть, що вам потрібно, і виконавці самі запропонують свої послуги
            </p>
          </div>

          {/* Баланс користувача */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ваш баланс:</p>
                <p className="text-2xl font-bold text-blue-600">{currentUser?.balanceUcm || 0} UCM</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Вартість заявки:</p>
                <p className="text-2xl font-bold text-gray-900">{totalCost} UCM</p>
              </div>
            </div>
            {Number(currentUser?.balanceUcm || 0) < totalCost && (
              <div className="mt-3 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Недостатньо коштів для створення заявки
              </div>
            )}
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
                Назва заявки <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                required
                maxLength={200}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Наприклад: Потрібен електрик для ремонту проводки"
              />
            </div>

            {/* Категорія */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-2">
                Категорія
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Виберіть категорію</option>
                <option value="Електрика">⚡ Електрика</option>
                <option value="Сантехніка">🚰 Сантехніка</option>
                <option value="Будівництво">🏗️ Будівництво</option>
                <option value="Ремонт">🔧 Ремонт</option>
                <option value="Дизайн">🎨 Дизайн</option>
                <option value="IT послуги">💻 IT послуги</option>
                <option value="Перевезення">🚚 Перевезення</option>
                <option value="Прибирання">🧹 Прибирання</option>
                <option value="Інше">📌 Інше</option>
              </select>
            </div>

            {/* Опис */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
                Детальний опис <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Опишіть детально, що вам потрібно, коли і які особливості роботи..."
              />
            </div>

            {/* Бюджет */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="budgetMin" className="block text-sm font-medium text-neutral-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Бюджет від (UCM)
                </label>
                <input
                  type="number"
                  id="budgetMin"
                  min="0"
                  step="0.01"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                />
              </div>
              <div>
                <label htmlFor="budgetMax" className="block text-sm font-medium text-neutral-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Бюджет до (UCM)
                </label>
                <input
                  type="number"
                  id="budgetMax"
                  min="0"
                  step="0.01"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="200"
                />
              </div>
            </div>

            {/* Місто */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Місто <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Київ"
              />
            </div>

            {/* Просування в ТОП */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-5">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPromoted}
                  onChange={(e) => setFormData({ ...formData, isPromoted: e.target.checked })}
                  className="mt-1 w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-gray-900">🔥 Просунути в ТОП</span>
                    <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">+2 UCM</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    Ваша заявка буде показуватись <strong>першою</strong> протягом <strong>3 днів</strong> і отримає в рази більше відгуків від виконавців
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>✅ Показується зверху</span>
                    <span>✅ Виділяється візуально</span>
                    <span>✅ 3 дні у топі</span>
                  </div>
                </div>
              </label>
            </div>

            {/* Підсумок */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Підсумок</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Публікація заявки:</span>
                  <span className="font-medium">5 UCM</span>
                </div>
                {formData.isPromoted && (
                  <div className="flex justify-between text-yellow-700">
                    <span>Просування в ТОП (3 дні):</span>
                    <span className="font-medium">+2 UCM</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-lg">
                  <span>Всього:</span>
                  <span className="text-blue-600">{totalCost} UCM</span>
                </div>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/public-requests')}
                className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={submitting || Number(currentUser?.balanceUcm || 0) < totalCost}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {submitting ? 'Створення...' : `Створити заявку (${totalCost} UCM)`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PublicRequestCreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-neutral-600">Завантаження...</div>
      </div>
    }>
      <PublicRequestFormContent />
    </Suspense>
  );
}
