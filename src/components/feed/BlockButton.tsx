'use client';

import { useState } from 'react';
import { Ban } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';

interface Props {
  userId: number;
  className?: string;
  onBlocked?: () => void;
}

/** Кнопка «Заблокувати» з підтвердженням у два кліки (без системних діалогів — стабільно у WebView). */
export function BlockButton({ userId, className = '', onBlocked }: Props) {
  const { t } = useI18n();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const block = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/blocks', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ userId }) });
      if (!res.ok) throw new Error();
      toast.success(t('feed.toast.blocked'));
      setConfirming(false);
      onBlocked?.();
    } catch {
      toast.error(t('feed.toast.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <span className="text-neutral-700">{t('feed.blocked.confirm')}</span>
        <button type="button" disabled={busy} onClick={block} className="rounded-lg bg-red-600 text-white px-3 py-1.5 disabled:opacity-50">{t('feed.blocked.block')}</button>
        <button type="button" onClick={() => setConfirming(false)} className="rounded-lg bg-neutral-100 px-3 py-1.5">{t('feed.composer.cancel')}</button>
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className={className || 'inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-neutral-500 hover:text-red-600 border border-neutral-200 hover:border-red-200 rounded-lg bg-white transition-colors'}>
      <Ban className="w-4 h-4" /> {t('feed.blocked.block')}
    </button>
  );
}
