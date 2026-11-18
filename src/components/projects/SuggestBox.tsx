'use client';

import { FormEvent, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { jsonHeaders } from '@/lib/feedClient';

/** «Пропозиція чи скарга»: людина просить додати розділ або повідомляє про проблему в проєкті. */
export function SuggestBox({ projectSlug }: { projectSlug: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'suggestion' | 'complaint'>('suggestion');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/project-suggestions', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ projectSlug, kind, text }) });
      if (!res.ok) throw new Error();
      toast.success(t('cabinet.suggest.sent'));
      setText(''); setOpen(false);
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/90 text-neutral-900 font-semibold py-3 shadow-md">
        <MessageSquarePlus className="w-5 h-5" />{t('cabinet.suggest.button')}
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 space-y-3 shadow-md">
      <div className="grid grid-cols-2 rounded-xl border border-neutral-200 overflow-hidden">
        {(['suggestion', 'complaint'] as const).map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={`py-2 text-sm font-semibold ${kind === k ? 'bg-space-700 text-white' : ''}`}>{t(`cabinet.suggest.${k}`)}</button>
        ))}
      </div>
      <textarea required minLength={5} maxLength={1000} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('cabinet.suggest.placeholder')} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
      <div className="flex gap-2">
        <button type="submit" disabled={sending} className="flex-1 rounded-full bg-primary-500 font-bold py-2.5 disabled:opacity-50">{t('cabinet.suggest.send')}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-neutral-100 font-semibold px-5">{t('cabinet.suggest.cancel')}</button>
      </div>
    </form>
  );
}
