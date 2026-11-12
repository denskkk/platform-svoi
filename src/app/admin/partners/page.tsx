'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';

type Status = 'pending' | 'approved' | 'rejected';
interface Item { id: number; projectSlug: string; phone: string; message: string; createdAt: string; rejectReason: string | null; user: { id: number; name: string; email: string } }
interface ProjectRow { slug: string; nameUk: string; nameEn: string }
const EMPTY = { titleUk: '', titleEn: '', bodyUk: '', bodyEn: '' };
const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

export default function AdminPartnersPage() {
  const router = useRouter();
  const { t, locale, formatDate } = useI18n();
  const toast = useToast();
  const [tab, setTab] = useState<'applications' | 'content'>('applications');
  const [forbidden, setForbidden] = useState(false);

  // Заявки
  const [status, setStatus] = useState<Status>('pending');
  const [items, setItems] = useState<Item[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  // Тексти
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [slug, setSlug] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [contentLoading, setContentLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (s: Status, after: number | null) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ status: s });
      if (after) qs.set('cursor', String(after));
      const res = await fetch(`/api/admin/partner-applications?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?returnUrl=/admin/partners'); return; }
      if (res.status === 403) { setForbidden(true); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems((prev) => (after ? [...prev, ...data.applications] : data.applications));
      setCursor(data.nextCursor);
    } catch {
      toast.error(t('projects.partnerAdmin.failed'));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/admin/partners'); return; }
    if (tab === 'applications') load(status, null);
  }, [status, tab, load, router]);

  useEffect(() => {
    if (tab !== 'content' || projects.length) return;
    (async () => {
      try {
        const res = await fetch('/api/admin/projects', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        if (!res.ok) throw new Error();
        const list: ProjectRow[] = (await res.json()).projects;
        setProjects(list);
        if (list[0]) setSlug(list[0].slug);
      } catch {
        toast.error(t('projects.partnerAdmin.failed'));
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== 'content' || !slug) return;
    let cancelled = false;
    setContentLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/admin/projects/${slug}/earn`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        if (!res.ok) throw new Error();
        const { page } = await res.json();
        if (!cancelled) setForm({ titleUk: page.titleUk, titleEn: page.titleEn, bodyUk: page.bodyUk, bodyEn: page.bodyEn });
      } catch {
        if (!cancelled) toast.error(t('projects.partnerAdmin.failed'));
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, tab]);

  const moderate = async (id: number, action: 'approve' | 'reject') => {
    if (action === 'reject' && !reason.trim()) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/partner-applications/${id}/moderate`, { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ action, reason: action === 'reject' ? reason.trim() : undefined }) });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== id));
      setRejecting(null); setReason('');
      toast.success(t('projects.partnerAdmin.done'));
    } catch {
      toast.error(t('projects.partnerAdmin.failed'));
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/projects/${slug}/earn`, { method: 'PUT', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast.success(t('projects.partnerAdmin.saved'));
    } catch {
      toast.error(t('projects.partnerAdmin.failed'));
    } finally {
      setSaving(false);
    }
  };

  const projectName = (s: string) => { const p = projects.find((x) => x.slug === s); return p ? (locale === 'uk' ? p.nameUk : p.nameEn) || p.nameUk : s; };
  const setF = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (forbidden) return <div className="mx-auto max-w-xl p-8 text-center text-neutral-600">{t('projects.partnerAdmin.forbidden')}</div>;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('projects.partnerAdmin.back')}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('projects.partnerAdmin.title')}</h1>
          <p className="text-sm text-neutral-500">{t('projects.partnerAdmin.subtitle')}</p>
        </div>

        <div role="tablist" className="grid grid-cols-2 rounded-full bg-white border border-neutral-200/70 p-1 shadow-sm">
          {(['applications', 'content'] as const).map((k) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)}
              className={cn('rounded-full py-2 text-sm font-semibold transition', tab === k ? 'bg-primary-500 text-white shadow' : 'text-neutral-600')}>
              {k === 'applications' ? t('projects.partnerAdmin.tabApplications') : t('projects.partnerAdmin.tabContent')}
            </button>
          ))}
        </div>

        {tab === 'applications' && (
          <>
            <div role="tablist" className="grid grid-cols-3 gap-1 text-sm">
              {(['pending', 'approved', 'rejected'] as Status[]).map((s) => (
                <button key={s} role="tab" type="button" aria-selected={status === s} onClick={() => { setItems([]); setCursor(null); setStatus(s); }}
                  className={cn('rounded-full py-1.5 font-medium border', status === s ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200')}>
                  {t(`projects.partnerAdmin.${s}`)}
                </button>
              ))}
            </div>
            {!loading && items.length === 0 && <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-neutral-600">{t('projects.partnerAdmin.empty')}</div>}
            <ul className="space-y-3">
              {items.map((a) => (
                <li key={a.id} className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-4 space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-neutral-900">{t('projects.partnerAdmin.project')}: {a.projectSlug}</p>
                    <span className="text-xs text-neutral-400">{formatDate(a.createdAt)}</span>
                  </div>
                  <p className="text-xs text-neutral-500">{t('projects.partnerAdmin.applicant')}: <Link href={`/profile/${a.user.id}`} className="underline">{a.user.name}</Link> · <a href={`tel:${a.phone.replace(/[^+0-9]/g, '')}`} className="underline">{a.phone}</a></p>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words">{a.message}</p>
                  {a.rejectReason && <p className="text-xs text-red-600">{t('projects.earn.reason')}: {a.rejectReason}</p>}
                  {status === 'pending' && rejecting !== a.id && (
                    <div className="flex gap-2 pt-1">
                      <button type="button" disabled={busy === a.id} onClick={() => moderate(a.id, 'approve')} className="rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2 disabled:opacity-60">
                        {busy === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : t('projects.partnerAdmin.approve')}
                      </button>
                      <button type="button" onClick={() => { setRejecting(a.id); setReason(''); }} className="rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold px-5 py-2">{t('projects.partnerAdmin.reject')}</button>
                    </div>
                  )}
                  {rejecting === a.id && (
                    <div className="space-y-2">
                      <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2} placeholder={t('projects.partnerAdmin.reasonPlaceholder')} className={inputCls} />
                      <div className="flex gap-2">
                        <button type="button" disabled={!reason.trim() || busy === a.id} onClick={() => moderate(a.id, 'reject')} className="rounded-full bg-red-600 text-white text-sm font-semibold px-5 py-2 disabled:opacity-50">{t('projects.partnerAdmin.confirmReject')}</button>
                        <button type="button" onClick={() => setRejecting(null)} className="rounded-full bg-neutral-100 text-sm font-semibold px-5 py-2">{t('projects.partnerAdmin.cancel')}</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {loading && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
            {!loading && cursor && <div className="flex justify-center"><button type="button" onClick={() => load(status, cursor)} className="rounded-full bg-white border border-neutral-200 px-6 py-2 text-sm font-semibold">{t('projects.partnerAdmin.loadMore')}</button></div>}
          </>
        )}

        {tab === 'content' && (
          <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-4 space-y-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-neutral-700">{t('projects.partnerAdmin.project')}</span>
              <select className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)}>
                {projects.map((p) => <option key={p.slug} value={p.slug}>{projectName(p.slug)}</option>)}
              </select>
            </label>
            {contentLoading ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div> : (
              <>
                <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('projects.partnerAdmin.titleUk')}</span><input className={inputCls} maxLength={150} value={form.titleUk} onChange={setF('titleUk')} /></label>
                <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('projects.partnerAdmin.bodyUk')}</span><textarea className={inputCls} rows={6} maxLength={8000} value={form.bodyUk} onChange={setF('bodyUk')} /></label>
                <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('projects.partnerAdmin.titleEn')}</span><input className={inputCls} maxLength={150} value={form.titleEn} onChange={setF('titleEn')} /></label>
                <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('projects.partnerAdmin.bodyEn')}</span><textarea className={inputCls} rows={6} maxLength={8000} value={form.bodyEn} onChange={setF('bodyEn')} /></label>
                <p className="text-xs text-neutral-400">{t('projects.partnerAdmin.bodyHint')}</p>
                <button type="button" onClick={save} disabled={saving || !slug} className="rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-2.5 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('projects.partnerAdmin.save')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
