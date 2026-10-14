'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

/**
 * Підказка для акаунта «Глядач»: пояснює обмеження та дає безкоштовний перехід на «Звичайний» профіль.
 */
export function ViewerUpgradeNotice({ className = '' }: { className?: string }) {
  const toast = useToast();
  const [isViewer, setIsViewer] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const stored = localStorage.getItem('user');
        setIsViewer(!!stored && JSON.parse(stored).accountType === 'viewer');
      } catch {
        setIsViewer(false);
      }
    };
    read();
    window.addEventListener('auth:changed', read);
    return () => window.removeEventListener('auth:changed', read);
  }, []);

  if (!isViewer) return null;

  const upgrade = async () => {
    setLoading(true);
    try {
      let token: string | null = null;
      try { token = localStorage.getItem('token'); } catch {}
      const res = await fetch('/api/user/upgrade', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ accountType: 'basic' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Не вдалося змінити тип профілю');

      try {
        const stored = localStorage.getItem('user');
        const merged = { ...(stored ? JSON.parse(stored) : {}), ...data.user };
        localStorage.setItem('user', JSON.stringify(merged));
        if (data.token) localStorage.setItem('token', data.token);
        window.dispatchEvent(new Event('auth:changed'));
      } catch {}

      toast.success(data.message || 'Готово!');
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || 'Не вдалося змінити тип профілю');
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 ${className}`}>
      <div className="flex items-start gap-3">
        <Eye className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" />
        <div className="flex-1">
          <p className="font-semibold mb-1">Ви увійшли як Глядач</p>
          <p className="mb-3">
            Глядач може переглядати профілі та послуги й зберігати їх в обране. Щоб писати у чаті, подавати заявки та
            залишати відгуки, перейдіть на звичайний профіль — це безкоштовно.
          </p>
          <button
            type="button"
            onClick={upgrade}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Зачекайте...' : 'Перейти на звичайний профіль'}
          </button>
        </div>
      </div>
    </div>
  );
}
