'use client';

import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';

export type FormKind = 'request' | 'consult' | 'suggestion' | 'complaint';
const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

/** Звернення до проєкту (заявка, консультація, пропозиція, скарга). Потрапляє в адмінку «Пропозиції» з назвою розділу. */
export function ProjectForm({ projectSlug, kind, label, withPlace, withAttach }: { projectSlug: string; kind: FormKind; label: string; withPlace?: boolean; withAttach?: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const [text, setText] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

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
    if (sending || uploading) return;
    if (phone.trim() && !/^\+?[0-9 ()-]{7,30}$/.test(phone.trim())) { toast.error(t('projects.china.phoneInvalid')); return; }
    setSending(true);
    try {
      const place = withPlace ? ` | ${[country.trim(), city.trim()].filter(Boolean).join(', ')}` : '';
      const files = photos.length ? ` | ${photos.join(' ')}` : '';
      const body = `[${label}] ${text.trim()}${place}${phone.trim() ? ` | ${t('projects.china.phone')}: ${phone.trim()}` : ''}${files}`.slice(0, 1000);
      const res = await fetch('/api/project-suggestions', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ projectSlug, kind, text: body }) });
      if (!res.ok) throw new Error();
      toast.success(t('projects.taxi.form.sent'));
      setText(''); setPhone(''); setPhotos([]);
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 space-y-3 shadow-md">
      {withPlace && (
        <div className="grid grid-cols-2 gap-2">
          <input required value={country} onChange={(e) => setCountry(e.target.value)} maxLength={60} placeholder={t('projects.form.country')} aria-label={t('projects.form.country')} className={inputCls} />
          <input required value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} placeholder={t('projects.form.city')} aria-label={t('projects.form.city')} className={inputCls} />
        </div>
      )}
      <textarea required minLength={5} maxLength={withAttach ? 600 : 750} rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('projects.taxi.form.hint')} className={inputCls} />
      <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder={t('projects.taxi.form.phone')} aria-label={t('projects.taxi.form.phone')} className={inputCls} />
      {withAttach && (
        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-800">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span aria-hidden>📎</span>}{t('projects.form.attach')}
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
          </label>
          {photos.length > 0 && <p className="text-xs text-neutral-500">{t('projects.form.attached', { count: photos.length })}</p>}
          <p className="text-xs text-neutral-400">{t('projects.form.attachNote')}</p>
        </div>
      )}
      <button type="submit" disabled={sending || uploading} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 font-bold py-2.5 disabled:opacity-50 inline-flex items-center justify-center gap-2">
        {sending && <Loader2 className="w-4 h-4 animate-spin" />}{t('cabinet.suggest.send')}
      </button>
    </form>
  );
}
