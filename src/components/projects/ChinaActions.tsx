'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Calculator, ClipboardList, Headphones, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { jsonHeaders } from '@/lib/feedClient';

type Mode = 'request' | 'consult';

/**
 * Три дії в кожному підрозділі проєкту «Китай» (за ТЗ замовника):
 * 1) залишити заявку, 2) отримати розрахунок (калькулятор закупівлі під ключ), 3) зв'язатися з консультантом.
 * Заявка й запит консультації потрапляють в адмінку («Пропозиції»), гроші система не рухає.
 */
export function ChinaActions({ sectionLabel }: { sectionLabel: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const [mode, setMode] = useState<Mode | null>(null);
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending || !mode) return;
    if (!/^\+?[0-9 ()-]{7,30}$/.test(phone.trim())) { toast.error(t('projects.china.phoneInvalid')); return; }
    setSending(true);
    try {
      const body = `[${sectionLabel}] ${text.trim()} | ${t('projects.china.phone')}: ${phone.trim()}`.slice(0, 1000);
      const res = await fetch('/api/project-suggestions', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ projectSlug: 'china', kind: mode, text: body }) });
      if (!res.ok) throw new Error();
      toast.success(t('projects.china.sent'));
      setText(''); setMode(null);
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  const btn = 'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition active:scale-95';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button type="button" onClick={() => setMode(mode === 'request' ? null : 'request')} aria-pressed={mode === 'request'} className={`${btn} ${mode === 'request' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-900 shadow-sm hover:shadow-md'}`}>
          <ClipboardList className="w-4 h-4" />{t('projects.china.leaveRequest')}
        </button>
        <Link href="/projects/china/calculator" className={`${btn} bg-white text-neutral-900 shadow-sm hover:shadow-md`}>
          <Calculator className="w-4 h-4" />{t('projects.china.getQuote')}
        </Link>
        <button type="button" onClick={() => setMode(mode === 'consult' ? null : 'consult')} aria-pressed={mode === 'consult'} className={`${btn} ${mode === 'consult' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-900 shadow-sm hover:shadow-md'}`}>
          <Headphones className="w-4 h-4" />{t('projects.china.consultant')}
        </button>
      </div>
      {mode && (
        <form onSubmit={submit} className="rounded-2xl bg-white p-4 space-y-3 shadow-md">
          <p className="text-sm font-semibold text-neutral-900">{t(`projects.china.${mode}Title`)}: {sectionLabel}</p>
          <textarea required minLength={10} maxLength={800} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t(`projects.china.${mode}Hint`)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          <input type="tel" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder={t('projects.china.phone')} aria-label={t('projects.china.phone')}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="flex-1 rounded-full bg-primary-500 font-bold py-2.5 disabled:opacity-50 inline-flex items-center justify-center gap-2">{sending && <Loader2 className="w-4 h-4 animate-spin" />}{t('cabinet.suggest.send')}</button>
            <button type="button" onClick={() => setMode(null)} className="rounded-full bg-neutral-100 font-semibold px-5">{t('cabinet.suggest.cancel')}</button>
          </div>
        </form>
      )}
    </div>
  );
}
