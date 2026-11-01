'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/client';
import { localizedPath } from '@/i18n/routes';

export function DeleteAccountForm() {
  const { t, locale } = useI18n();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      setIsAuthed(!!localStorage.getItem('user'));
    } catch {
      setIsAuthed(false);
    }
  }, []);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!confirmed) {
      setError(t('common.deleteAccount.confirmRequired'));
      return;
    }
    if (!password) {
      setError(t('common.deleteAccount.passwordRequired'));
      return;
    }

    setLoading(true);
    try {
      let token: string | null = null;
      try { token = localStorage.getItem('token'); } catch {}
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('common.deleteAccount.failed'));

      try {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth:changed'));
      } catch {}
      setDone(true);
    } catch (err: any) {
      setError(err.message || t('common.deleteAccount.failed'));
    } finally {
      setLoading(false);
    }
  };

  if (isAuthed === null) return null;

  if (done) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
        {t('common.deleteAccount.done')}{' '}
        <Link href={localizedPath('/', locale)} className="underline font-medium">{t('common.deleteAccount.goHome')}</Link>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700">
        {t('common.deleteAccount.loginHintBefore')}<Link href="/auth/login" className="text-blue-600 hover:underline font-medium">{t('common.deleteAccount.loginHintLink')}</Link>{t('common.deleteAccount.loginHintAfter')}
      </div>
    );
  }

  return (
    <form onSubmit={handleDelete} className="space-y-4 p-5 border-2 border-red-200 bg-red-50/50 rounded-xl">
      <p className="text-sm text-red-800">
        {t('common.deleteAccount.warning')}
      </p>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label htmlFor="delete-password" className="block text-sm font-medium text-gray-800 mb-1">
          {t('common.deleteAccount.passwordLabel')}
        </label>
        <input
          id="delete-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1"
        />
        <span>{t('common.deleteAccount.confirmLabel')}</span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50"
      >
        {loading ? t('common.deleteAccount.deleting') : t('common.deleteAccount.submit')}
      </button>
    </form>
  );
}
