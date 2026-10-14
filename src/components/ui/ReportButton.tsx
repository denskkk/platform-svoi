'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

type ContentType = 'user' | 'service' | 'request' | 'review' | 'message';

interface ReportButtonProps {
  reportedUserId: number;
  contentType?: ContentType;
  contentId?: number;
  label?: string;
  className?: string;
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'spam', label: 'Спам або небажана реклама' },
  { value: 'fraud', label: 'Шахрайство' },
  { value: 'abuse', label: 'Образи, погрози, домагання' },
  { value: 'inappropriate', label: 'Недопустимий вміст' },
  { value: 'fake', label: 'Фальшивий профіль або відгук' },
  { value: 'other', label: 'Інше' },
];

export function ReportButton({
  reportedUserId,
  contentType = 'user',
  contentId,
  label = 'Поскаржитися',
  className = '',
}: ReportButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('spam');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  const handleOpen = () => {
    let user: string | null = null;
    try { user = localStorage.getItem('user'); } catch {}
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setOpen(true);
  };

  const submit = async () => {
    setSending(true);
    try {
      let token: string | null = null;
      try { token = localStorage.getItem('token'); } catch {}
      const res = await fetch('/api/reports', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reportedUserId, contentType, contentId, category, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Не вдалося надіслати скаргу');
      toast.success(data.message || 'Скаргу надіслано');
      setOpen(false);
      setReason('');
    } catch (e: any) {
      toast.error(e.message || 'Не вдалося надіслати скаргу');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          className ||
          'inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-red-600 transition-colors'
        }
      >
        <Flag className="w-4 h-4" />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !sending && setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="report-title" className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 id="report-title" className="text-lg font-bold text-neutral-900">Поскаржитися</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700" aria-label="Закрити">
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="report-category">Причина</label>
            <select
              id="report-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="report-reason">Опишіть проблему (необов’язково)</label>
            <textarea
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Що саме порушує правила платформи?"
            />

            <p className="text-xs text-neutral-500 mb-4">
              Адміністрація перегляне скаргу та за потреби обмежить доступ порушника. Зловживання скаргами заборонені.
            </p>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} disabled={sending} className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50">
                Скасувати
              </button>
              <button type="button" onClick={submit} disabled={sending} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
                {sending ? 'Надсилаємо...' : 'Надіслати'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
