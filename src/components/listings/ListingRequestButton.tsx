'use client';

import { FormEvent, useState } from 'react';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { jsonHeaders } from '@/lib/feedClient';

export type RequestVariant = 'viewing' | 'rent' | 'pickup';
const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

/**
 * «Записатися на перегляд» / «Подати заявку на оренду» / «Домовитися про отримання»:
 * надсилає власникові повідомлення з посиланням на оголошення, бажаним часом і телефоном (з'являється в його чаті).
 */
export function ListingRequestButton({ variant, ownerId, listingId, title }: { variant: RequestVariant; ownerId: number; listingId: number; title: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!/^\+?[0-9 ()-]{7,30}$/.test(phone.trim())) { toast.error(t('projects.china.phoneInvalid')); return; }
    setSending(true);
    try {
      const link = `${window.location.origin}/listings/${listingId}`;
      const text = t(`listings.request.message.${variant}`, { title, link, when: when ? new Date(when).toLocaleString() : '—', phone: phone.trim(), note: note.trim() || '—' }).slice(0, 4000);
      const res = await fetch('/api/messages', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ receiverId: ownerId, text }) });
      if (!res.ok) throw new Error();
      setDone(true); setOpen(false);
      toast.success(t('listings.request.sent'));
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  return (
    <div className="w-full space-y-2">
      <button type="button" disabled={done} onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex items-center gap-2 rounded-full bg-white border border-neutral-200 font-semibold px-5 py-2.5 disabled:opacity-60">
        <CalendarCheck className="w-5 h-5" /> {done ? t('listings.request.sentShort') : t(`listings.request.button.${variant}`)}
      </button>
      {open && (
        <form onSubmit={submit} className="rounded-2xl bg-white border border-neutral-200 p-3 space-y-2">
          <label className="block text-sm font-semibold text-neutral-700">{t(`listings.request.when.${variant}`)}
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={`${inputCls} mt-1 font-normal`} />
          </label>
          <input type="tel" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder={t('projects.china.phone')} aria-label={t('projects.china.phone')} className={inputCls} />
          <textarea rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('listings.request.note')} className={inputCls} />
          <button type="submit" disabled={sending} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 font-bold py-2 disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}{t('cabinet.suggest.send')}
          </button>
        </form>
      )}
    </div>
  );
}
