'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';

type ContentType = 'user' | 'service' | 'request' | 'review' | 'message';

interface ReportButtonProps {
  reportedUserId: number;
  contentType?: ContentType;
  contentId?: number;
  label?: string;
  className?: string;
}

const CATEGORIES: { value: string; labelKey: string }[] = [
  { value: 'spam', labelKey: 'common.report.categories.spam' },
  { value: 'fraud', labelKey: 'common.report.categories.fraud' },
  { value: 'abuse', labelKey: 'common.report.categories.abuse' },
  { value: 'inappropriate', labelKey: 'common.report.categories.inappropriate' },
  { value: 'fake', labelKey: 'common.report.categories.fake' },
  { value: 'other', labelKey: 'common.report.categories.other' },
];

export function ReportButton({
  reportedUserId,
  contentType = 'user',
  contentId,
  label,
  className = '',
}: ReportButtonProps) {
  const { t } = useI18n();
  const buttonLabel = label ?? t('common.report.title');
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
      if (!res.ok) throw new Error(data.error || t('common.report.failed'));
      toast.success(data.message || t('common.report.sent'));
      setOpen(false);
      setReason('');
    } catch (e: any) {
      toast.error(e.message || t('common.report.failed'));
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
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !sending && setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="report-title" className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 id="report-title" className="text-lg font-bold text-neutral-900">{t('common.report.title')}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700" aria-label={t('common.actions.close')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="report-category">{t('common.report.reasonLabel')}</label>
            <select
              id="report-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{t(c.labelKey)}</option>
              ))}
            </select>

            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="report-reason">{t('common.report.describeLabel')}</label>
            <textarea
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('common.report.placeholder')}
            />

            <p className="text-xs text-neutral-500 mb-4">
              {t('common.report.notice')}
            </p>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} disabled={sending} className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50">
                {t('common.actions.cancel')}
              </button>
              <button type="button" onClick={submit} disabled={sending} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
                {sending ? t('common.report.sending') : t('common.report.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
