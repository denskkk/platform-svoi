'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingCardData } from '@/components/listings/helpers';

const SLUG = 'real-estate';
const SECTION = 'real_estate_home_moving';
const ORDERS = ['loaders', 'disassembly', 'transport', 'full_move'] as const;
const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

/**
 * «Вантажники, розбірники та перевізники»: виконавці реєструються й додають послуги (форма оголошення розділу),
 * замовники залишають заявку (країна, місто, адреса, що зробити, фото, дата, телефон) і одразу бачать виконавців свого міста.
 */
export function MovingActions() {
  const { t } = useI18n();
  const toast = useToast();
  const [mode, setMode] = useState<(typeof ORDERS)[number] | null>(null);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [what, setWhat] = useState('');
  const [when, setWhen] = useState('');
  const [phone, setPhone] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [performers, setPerformers] = useState<ListingCardData[] | null>(null);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, Math.max(0, 3 - photos.length))) {
        const form = new FormData();
        form.append('file', file);
        form.append('type', 'posts');
        const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', headers: authHeaders(), body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error);
        setPhotos((prev) => prev.concat(data.url));
      }
    } catch (e: any) { toast.error(e?.message || t('feed.toast.actionFailed')); } finally { setUploading(false); }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending || uploading || !mode) return;
    if (!/^\+?[0-9 ()-]{7,30}$/.test(phone.trim())) { toast.error(t('projects.china.phoneInvalid')); return; }
    setSending(true);
    try {
      const text = `[${t(`projects.realEstate.moving.orders.${mode}`)}] ${country.trim()}, ${city.trim()}; ${address.trim()}; ${what.trim()}; ${when ? new Date(when).toLocaleString() : '—'} | ${t('projects.china.phone')}: ${phone.trim()}${photos.length ? ` | ${photos.join(' ')}` : ''}`.slice(0, 1000);
      const res = await fetch('/api/project-suggestions', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ projectSlug: SLUG, kind: 'request', text }) });
      if (!res.ok) throw new Error();
      toast.success(t('projects.realEstate.moving.sent'));
      // Виконавці, які працюють у цьому місті
      const qs = new URLSearchParams({ project: SLUG, f_section: SECTION, city: city.trim() });
      const list = await fetch(`/api/listings?${qs.toString()}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      setPerformers(list.ok ? (await list.json()).listings : []);
      setWhat(''); setPhotos([]);
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  const btn = 'rounded-xl px-3 py-2.5 text-sm font-semibold transition active:scale-95';
  return (
    <div className="space-y-3">
      <section className="rounded-2xl bg-black/30 backdrop-blur p-3 space-y-2 text-white">
        <p className="text-sm font-bold">{t('projects.realEstate.moving.performers')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link href={`/projects/${SLUG}/new?section=${SECTION}`} className={`${btn} bg-white text-neutral-900 text-center`}>{t('projects.realEstate.moving.register')}</Link>
          <Link href={`/projects/${SLUG}/new?section=${SECTION}`} className={`${btn} bg-white text-neutral-900 text-center`}>{t('projects.realEstate.moving.addServices')}</Link>
        </div>
      </section>

      <section className="rounded-2xl bg-black/30 backdrop-blur p-3 space-y-2 text-white">
        <p className="text-sm font-bold">{t('projects.realEstate.moving.customers')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ORDERS.map((k) => (
            <button key={k} type="button" aria-pressed={mode === k} onClick={() => { setMode(mode === k ? null : k); setPerformers(null); }} className={`${btn} ${mode === k ? 'bg-primary-500 text-white' : 'bg-white text-neutral-900'}`}>{t(`projects.realEstate.moving.orders.${k}`)}</button>
          ))}
        </div>
      </section>

      {mode && (
        <form onSubmit={submit} className="rounded-2xl bg-white p-4 space-y-3 shadow-md">
          <p className="text-sm font-semibold text-neutral-900">{t(`projects.realEstate.moving.orders.${mode}`)}</p>
          <div className="grid grid-cols-2 gap-2">
            <input required value={country} onChange={(e) => setCountry(e.target.value)} maxLength={60} placeholder={t('projects.form.country')} aria-label={t('projects.form.country')} className={inputCls} />
            <input required value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} placeholder={t('projects.form.city')} aria-label={t('projects.form.city')} className={inputCls} />
          </div>
          <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={150} placeholder={t('projects.realEstate.moving.address')} aria-label={t('projects.realEstate.moving.address')} className={inputCls} />
          <textarea required minLength={5} maxLength={400} rows={3} value={what} onChange={(e) => setWhat(e.target.value)} placeholder={t('projects.realEstate.moving.what')} className={inputCls} />
          <label className="block text-sm font-semibold text-neutral-700">{t('projects.realEstate.moving.when')}
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={`${inputCls} mt-1 font-normal`} />
          </label>
          <input type="tel" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder={t('projects.china.phone')} aria-label={t('projects.china.phone')} className={inputCls} />
          <div className="space-y-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-800">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span aria-hidden>📷</span>}{t('projects.realEstate.moving.photos')}
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
            </label>
            {photos.length > 0 && <p className="text-xs text-neutral-500">{t('projects.form.attached', { count: photos.length })}</p>}
          </div>
          <button type="submit" disabled={sending || uploading} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 font-bold py-2.5 disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}{t('projects.realEstate.moving.submit')}
          </button>
        </form>
      )}

      {performers && (
        <section className="space-y-2">
          <p className="text-sm font-bold text-white px-1">{performers.length > 0 ? t('projects.realEstate.moving.inCity', { city }) : t('projects.realEstate.moving.noneInCity', { city })}</p>
          {performers.length > 0 && <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3">{performers.map((l) => <li key={l.id}><ListingCard listing={l} canSave={false} /></li>)}</ul>}
        </section>
      )}
    </div>
  );
}
