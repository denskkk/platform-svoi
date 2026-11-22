'use client';

import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';
import { FIELDS, FORMS, parseField } from '@/lib/projectForms';

const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';
const MAX_TEXT = 3000;

/**
 * Структурна анкета проєкту (поля з projectForms). Відповіді збираються в одне звернення «[Розділ] Поле: значення | …»
 * і потрапляють в адмінку «Пропозиції»; користувач бачить статус у «Мої заявки».
 */
export function FieldsForm({ projectSlug, formId, label, onSent }: { projectSlug: string; formId: string; label: string; onSent?: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const def = FORMS[formId];
  const [vals, setVals] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  if (!def) return null;

  const set = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }));
  const specs = def.fields.map(parseField);
  const withPhotos = specs.some((s) => s.key === 'photos');

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
    const phone = (vals.phone || '').trim();
    if (phone && !/^\+?[0-9 ()-]{7,30}$/.test(phone)) { toast.error(t('projects.china.phoneInvalid')); return; }
    const parts: string[] = [];
    specs.forEach((s) => {
      if (s.heading || s.key === 'photos') return;
      const v = (vals[s.key] || '').trim();
      if (!v) return;
      const shown = FIELDS[s.key]?.t === 'sel' ? t(`projects.fopt.${s.key}.${v}`) : v;
      parts.push(`${t(`projects.fld.${s.key}`)}: ${shown}`);
    });
    const body = `[${label}] ${parts.join(' | ')}${photos.length ? ` | ${photos.join(' ')}` : ''}`;
    if (body.length > MAX_TEXT) { toast.error(t('projects.f.tooLong')); return; }
    setSending(true);
    try {
      const res = await fetch('/api/project-suggestions', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ projectSlug, kind: def.kind, text: body }) });
      if (!res.ok) throw new Error();
      toast.success(t('projects.f.sent'));
      setVals({}); setPhotos([]);
      onSent?.();
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 space-y-3 shadow-md">
      {def.note && <p className="rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 p-2.5">{t(`projects.fnote.${def.note}`)}</p>}
      {specs.map((s) => {
        if (s.heading) return <p key={s.key} className="pt-1 text-xs font-bold uppercase tracking-wide text-neutral-500">{t(`projects.fh.${s.key}`)}</p>;
        if (s.key === 'photos') return null;
        const f = FIELDS[s.key];
        if (!f) return null;
        const lab = t(`projects.fld.${s.key}`);
        const common = { id: `f-${formId}-${s.key}`, required: s.required, value: vals[s.key] ?? '', 'aria-label': lab, className: inputCls };
        return (
          <label key={s.key} className="block text-sm font-semibold text-neutral-700">
            <span>{lab}{s.required ? ' *' : ''}</span>
            {f.t === 'area' && <textarea {...common} rows={3} maxLength={500} onChange={(e) => set(s.key, e.target.value)} />}
            {f.t === 'sel' && (
              <select {...common} onChange={(e) => set(s.key, e.target.value)}>
                <option value="">—</option>
                {f.opts?.map((o) => <option key={o} value={o}>{t(`projects.fopt.${s.key}.${o}`)}</option>)}
              </select>
            )}
            {f.t === 'num' && <input {...common} type="number" inputMode="numeric" min={0} max={9999} onChange={(e) => set(s.key, e.target.value)} />}
            {f.t === 'date' && <input {...common} type="date" onChange={(e) => set(s.key, e.target.value)} />}
            {f.t === 'tel' && <input {...common} type="tel" inputMode="tel" maxLength={30} onChange={(e) => set(s.key, e.target.value)} />}
            {f.t === 'email' && <input {...common} type="email" maxLength={100} onChange={(e) => set(s.key, e.target.value)} />}
            {f.t === 'text' && <input {...common} type="text" maxLength={150} onChange={(e) => set(s.key, e.target.value)} />}
          </label>
        );
      })}
      {withPhotos && (
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
