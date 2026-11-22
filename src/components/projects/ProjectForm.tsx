'use client';

import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { jsonHeaders } from '@/lib/feedClient';

export type FormKind = 'request' | 'consult' | 'suggestion' | 'complaint';
const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

/** Звернення до проєкту (заявка, консультація, пропозиція, скарга). Потрапляє в адмінку «Пропозиції» з назвою розділу. */
export function ProjectForm({ projectSlug, kind, label }: { projectSlug: string; kind: FormKind; label: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const [text, setText] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (phone.trim() && !/^\+?[0-9 ()-]{7,30}$/.test(phone.trim())) { toast.error(t('projects.china.phoneInvalid')); return; }
    setSending(true);
    try {
      const body = `[${label}] ${text.trim()}${phone.trim() ? ` | ${t('projects.china.phone')}: ${phone.trim()}` : ''}`.slice(0, 1000);
      const res = await fetch('/api/project-suggestions', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ projectSlug, kind, text: body }) });
      if (!res.ok) throw new Error();
      toast.success(t('projects.taxi.form.sent'));
      setText(''); setPhone('');
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 space-y-3 shadow-md">
      <textarea required minLength={5} maxLength={800} rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('projects.taxi.form.hint')} className={inputCls} />
      <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder={t('projects.taxi.form.phone')} aria-label={t('projects.taxi.form.phone')} className={inputCls} />
      <button type="submit" disabled={sending} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 font-bold py-2.5 disabled:opacity-50 inline-flex items-center justify-center gap-2">
        {sending && <Loader2 className="w-4 h-4 animate-spin" />}{t('cabinet.suggest.send')}
      </button>
    </form>
  );
}
