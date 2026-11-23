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
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  if (!def) return null;

  const set = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }));
  const specs = def.fields.map(parseField);
  const withPhotos = specs.some((s) => s.key === 'photos');
  // Кроки (лише для анкет із wizard): кожен «#заголовок» — окремий крок; останній — перегляд і підтвердження
  const groups: Array<{ heading: string; items: typeof specs }> = [];
  specs.forEach((s) => { if (s.heading) groups.push({ heading: s.key, items: [] }); else if (groups.length) groups[groups.length - 1].items.push(s); });
  const wizard = !!def.wizard && groups.length > 1;
  const last = groups.length; // індекс кроку «перегляд»
  const onReview = wizard && step === last;
  const missing = (g: { items: typeof specs }) => g.items.some((s) => s.required && s.key !== 'photos' && !(vals[s.key] || '').trim());
  const shownVal = (k: string) => { const v = (vals[k] || '').trim(); return v && FIELDS[k]?.t === 'sel' ? t(`projects.fopt.${k}.${v}`) : v; };
  const next = () => {
    if (missing(groups[step])) { toast.error(t('projects.f.stepRequired')); return; }
    setStep((x) => Math.min(last, x + 1));
  };

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
    if (wizard && !onReview) { next(); return; }
    if (wizard && !confirmed) { toast.error(t('projects.f.confirmRequired')); return; }
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
      setVals({}); setPhotos([]); setStep(0); setConfirmed(false);
      onSent?.();
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 space-y-3 shadow-md">
      {def.note && <p className="rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 p-2.5">{t(`projects.fnote.${def.note}`)}</p>}
      {wizard && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-neutral-500">{onReview ? t('projects.f.review') : t('projects.f.step', { n: step + 1, total: groups.length })}</p>
          <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden"><div className="h-full bg-primary-500" style={{ width: `${Math.round(((step + 1) / (groups.length + 1)) * 100)}%` }} /></div>
        </div>
      )}
      {onReview && (
        <div className="space-y-2">
          <p className="text-sm text-neutral-700">{t('projects.f.reviewLead')}</p>
          <dl className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 space-y-1 text-sm">
            {groups.flatMap((g) => g.items).filter((s) => s.key !== 'photos' && shownVal(s.key)).map((s) => (
              <div key={s.key} className="flex gap-2"><dt className="text-neutral-500 shrink-0">{t(`projects.fld.${s.key}`)}:</dt><dd className="text-neutral-900 break-words">{shownVal(s.key)}</dd></div>
            ))}
          </dl>
          <label className="flex items-start gap-2 text-sm text-neutral-800"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" /><span>{t('projects.f.confirm')}</span></label>
        </div>
      )}
      {(!wizard ? specs : onReview ? [] : [{ key: groups[step].heading, heading: true, required: false }, ...groups[step].items]).map((s) => {
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
      {withPhotos && (!wizard || step === last - 1) && !onReview && (
        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-800">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span aria-hidden>📎</span>}{t('projects.form.attach')}
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
          </label>
          {photos.length > 0 && <p className="text-xs text-neutral-500">{t('projects.form.attached', { count: photos.length })}</p>}
          <p className="text-xs text-neutral-400">{t('projects.form.attachNote')}</p>
        </div>
      )}
      <div className="flex gap-2">
        {wizard && step > 0 && <button type="button" onClick={() => setStep((x) => Math.max(0, x - 1))} className="rounded-full border border-neutral-300 px-5 py-2.5 font-bold text-neutral-800">{t('projects.f.back')}</button>}
        <button type="submit" disabled={sending || uploading} className="flex-1 rounded-full bg-primary-500 hover:bg-primary-600 font-bold py-2.5 disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {sending && <Loader2 className="w-4 h-4 animate-spin" />}{wizard && !onReview ? t('projects.f.next') : wizard ? t('projects.f.publish') : t('cabinet.suggest.send')}
        </button>
      </div>
    </form>
  );
}
