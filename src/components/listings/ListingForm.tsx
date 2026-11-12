'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ImagePlus, Loader2, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { CURRENCIES, fieldsFor, LISTING_LIMITS } from '@/lib/listingFields';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';

export interface ListingFormInitial {
  id: number;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  city: string | null;
  contactName: string | null;
  phone: string | null;
  data: Record<string, string | number>;
  images: { id: number; url: string }[];
}

interface Props {
  slug: string;
  initial?: ListingFormInitial;
}

export function ListingForm({ slug, initial }: Props) {
  const { t } = useI18n();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const fields = fieldsFor(slug);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'UAH');
  const [city, setCity] = useState(initial?.city ?? '');
  const [contactName, setContactName] = useState(initial?.contactName ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [data, setData] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(initial?.data ?? {}).filter(([k]) => !k.endsWith('_l')).map(([k, v]) => [k, String(v)]))
  );
  const [images, setImages] = useState<string[]>(initial?.images.map((i) => i.url) ?? []);
  const [uploading, setUploading] = useState(0);
  const [sending, setSending] = useState(false);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<number | null>(null);

  const inputCls = (name: string) =>
    `w-full rounded-xl border px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${errorField === name ? 'border-red-400' : 'border-neutral-200'}`;

  const pickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = LISTING_LIMITS.maxImages - images.length - uploading;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > chosen.length) toast.info(t('listings.form.maxPhotos', { max: LISTING_LIMITS.maxImages }));
    setUploading((n) => n + chosen.length);
    await Promise.all(chosen.map(async (file) => {
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('type', 'listings');
        const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', headers: authHeaders(), body: form });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.url) throw new Error(json.error);
        setImages((prev) => [...prev, json.url]);
      } catch (e: any) {
        toast.error(e?.message || t('listings.form.uploadFailed'));
      } finally {
        setUploading((n) => n - 1);
      }
    }));
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || uploading > 0) return;
    setSending(true);
    setErrorField(null);
    try {
      const payload = { projectSlug: slug, title, description, price: price === '' ? null : Number(price), currency, city, contactName, phone, data, images };
      const res = await fetch(initial ? `/api/listings/${initial.id}` : '/api/listings', {
        method: initial ? 'PATCH' : 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.field) setErrorField(json.field);
        throw new Error(json.error);
      }
      setDoneId(initial ? initial.id : json.id);
      window.scrollTo({ top: 0 });
    } catch (err: any) {
      toast.error(err?.message || t('feed.toast.actionFailed'));
    } finally {
      setSending(false);
    }
  };

  if (doneId !== null) {
    return (
      <div className="bg-white rounded-3xl border border-neutral-200/70 shadow-sm p-8 text-center space-y-4">
        <CheckCircle2 className="w-14 h-14 mx-auto text-green-500" />
        <h2 className="text-xl font-bold text-neutral-900">{t('listings.form.successTitle')}</h2>
        <p className="text-neutral-600">{t('listings.form.successText')}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/my-listings" className="rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2.5">{t('listings.form.toMyListings')}</Link>
          <Link href={`/projects/${slug}`} className="rounded-full bg-neutral-100 hover:bg-neutral-200 font-semibold px-6 py-2.5">{t('listings.form.toProject')}</Link>
        </div>
      </div>
    );
  }

  const label = (text: string, required?: boolean) => (
    <span className="block text-sm font-medium text-neutral-700 mb-1">{text}{required && <span className="text-red-500"> *</span>}</span>
  );

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl border border-neutral-200/70 shadow-sm p-4 sm:p-6 space-y-4">
      <label className="block">
        {label(t('listings.form.title'), true)}
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LISTING_LIMITS.titleMax} required className={inputCls('title')} />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((f) => {
          const name = t(`listings.fields.${slug}.${f.key}`);
          return (
            <label key={f.key} className="block">
              {label(name, f.required)}
              {f.type === 'select' ? (
                <select value={data[f.key] ?? ''} onChange={(e) => setData((d) => ({ ...d, [f.key]: e.target.value }))} required={f.required} className={inputCls(f.key)}>
                  <option value="">—</option>
                  {f.options?.map((o) => <option key={o} value={o}>{t(`listings.options.${f.key}.${o}`)}</option>)}
                </select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  inputMode={f.type === 'number' ? 'decimal' : undefined}
                  step={f.type === 'number' ? 'any' : undefined}
                  min={f.min}
                  max={f.max}
                  maxLength={f.maxLength}
                  value={data[f.key] ?? ''}
                  onChange={(e) => setData((d) => ({ ...d, [f.key]: e.target.value }))}
                  required={f.required}
                  className={inputCls(f.key)}
                />
              )}
            </label>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="block col-span-2">
          {label(t('listings.common.price'))}
          <input type="number" inputMode="decimal" min={0} step="any" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls('price')} />
        </label>
        <label className="block">
          {label(t('listings.common.currency'))}
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls('currency')}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{t(`listings.currencies.${c}`)}</option>)}
          </select>
        </label>
      </div>

      <label className="block">
        {label(t('listings.common.city'), true)}
        <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} required className={inputCls('city')} />
      </label>

      <label className="block">
        {label(t('listings.form.description'), true)}
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={LISTING_LIMITS.descriptionMax} rows={6} required className={inputCls('description')} />
      </label>

      {/* Фото */}
      <div>
        {label(`${t('listings.form.photos')} (${t('listings.form.maxPhotos', { max: LISTING_LIMITS.maxImages })})`)}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1 bottom-1 rounded bg-black/60 text-white text-[10px] px-1.5 py-0.5">1</span>}
              <button type="button" onClick={() => setImages((prev) => prev.filter((u) => u !== url))} aria-label={t('listings.form.removePhoto')} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <div key={`u${i}`} className="aspect-square rounded-xl bg-neutral-100 flex items-center justify-center" aria-label={t('listings.form.uploading')}><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
          ))}
          {images.length + uploading < LISTING_LIMITS.maxImages && (
            <button type="button" onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 text-neutral-500 hover:border-primary-400 hover:text-primary-600 flex flex-col items-center justify-center gap-1 text-xs">
              <ImagePlus className="w-6 h-6" /> {t('listings.form.addPhotos')}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => pickFiles(e.target.files)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          {label(t('listings.form.contactName'))}
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={100} className={inputCls('contactName')} />
        </label>
        <label className="block">
          {label(t('listings.form.phone'))}
          <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} className={inputCls('phone')} />
        </label>
      </div>

      <p className="text-xs text-neutral-500">{initial ? t('listings.form.editNote') : t('listings.form.moderationNote')}</p>

      <button type="submit" disabled={sending || uploading > 0} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 disabled:opacity-50 inline-flex items-center justify-center gap-2">
        {sending && <Loader2 className="w-4 h-4 animate-spin" />}
        {sending ? t('listings.form.sending') : initial ? t('listings.form.saveChanges') : t('listings.form.submit')}
      </button>
    </form>
  );
}
