"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type UpgradeTarget = 'extended' | 'business' | 'business_premium';

export default function UpgradeAccountPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [target, setTarget] = useState<UpgradeTarget>('extended');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        // If already higher than basic suggest next tier
        if (parsed.accountType === 'extended') setTarget('business');
        if (parsed.accountType === 'business') setTarget('business_premium');
      }
    } catch {}
  }, []);

  const canUpgrade = () => {
    if (!currentUser) return false;
    const order = ['basic', 'extended', 'business', 'business_premium'];
    const idx = order.indexOf(currentUser.accountType);
    const targetIdx = order.indexOf(target);
    // Можна апгрейдитись тільки на НАСТУПНИЙ рівень (не можна перестрибувати)
    return targetIdx === idx + 1;
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpgrade()) {
      setError('Неможливо виконати апгрейд');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/account/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Помилка апгрейду');
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth:changed'));
      setSuccess(true);
      // Navigate to edit to fill extended/business fields
      setTimeout(() => {
        router.push('/profile/edit');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Помилка сервера');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-neutral-600">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href={`/profile/${currentUser.id}`} className="text-blue-600 hover:text-blue-700 text-sm">← До профілю</Link>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-4">Апгрейд акаунту</h1>
          <p className="text-neutral-600 mb-6">Поточний тип: <strong>{currentUser.accountType}</strong>. Оберіть новий рівень та підтвердіть. Після апгрейду з'являться додаткові поля для заповнення.</p>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">Апгрейд успішний! Перенаправлення...</div>}

          <form onSubmit={handleUpgrade} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Новий рівень</label>
              <select
                value={target}
                onChange={e => setTarget(e.target.value as UpgradeTarget)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {currentUser.accountType === 'basic' && (
                  <option value="extended">Розширений (наступний крок)</option>
                )}
                {currentUser.accountType === 'extended' && (
                  <option value="business">Бізнес (наступний крок)</option>
                )}
                {currentUser.accountType === 'business' && (
                  <option value="business_premium">Бізнес Преміум (наступний крок)</option>
                )}
              </select>
              <p className="text-xs text-neutral-500 mt-1">Апгрейд можливий лише на наступний рівень послідовно.</p>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-700 space-y-2">
              {target === 'extended' && (
                <p>Отримаєте доступ до повного профілю, заявок та розширеного пошуку. 3 місяці безкоштовно.</p>
              )}
              {target === 'business' && (
                <p>Додайте бізнес-інформацію, послуги та отримуйте клієнтів. 3 місяці безкоштовно.</p>
              )}
              {target === 'business_premium' && (
                <p>Преміум промо, пропозиції партнерам та інвесторам, аналітика. 3 місяці безкоштовно.</p>
              )}
              <p className="text-xs text-neutral-500">Після підтвердження ви зможете заповнити додаткові поля на сторінці редагування профілю.</p>
            </div>

            <button
              disabled={loading || !canUpgrade()}
              className="w-full py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Виконання...' : 'Підтвердити апгрейд'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
