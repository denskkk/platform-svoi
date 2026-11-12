'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';

interface Application {
  id: number; companyName: string; status: 'pending' | 'approved' | 'rejected';
  createdAt: string; rejectReason: string | null; proposedRewardPercent: number | null;
}
interface ProjectOption { slug: string; nameUk: string; nameEn: string }

const EMPTY = { companyName: '', activity: '', city: '', contactName: '', phone: '', website: '', projectSlug: '', description: '' };
const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-primary-50 text-primary-900',
  approved: 'bg-green-50 text-green-800',
  rejected: 'bg-red-50 text-red-700',
};
const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-400';

export default function BusinessApplyPage() {
  const router = useRouter();
  const { t, locale, formatDate } = useI18n();
  const toast = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      const [a, p] = await Promise.all([
        fetch('/api/business-applications', { credentials: 'include', headers: authHeaders(), cache: 'no-store' }),
        fetch('/api/projects', { cache: 'no-store' }),
      ]);
      if (a.status === 401) { router.replace('/auth/login?returnUrl=/business/apply'); return; }
      if (a.ok) setApps((await a.json()).applications);
      if (p.ok) setProjects((await p.json()).projects);
    } catch {
      toast.error(t('business.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/business/apply'); return; }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latest = apps[0];
  const blocked = latest && (latest.status === 'pending' || latest.status === 'approved');
  const formVisible = !blocked && (apps.length === 0 || showForm);

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/business-applications', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || t('business.failed')); return; }
      toast.success(t('business.success'));
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch {
      toast.error(t('business.failed'));
    } finally {
      setSending(false);
    }
  };

  const field = (k: keyof typeof EMPTY, label: string, props: Record<string, unknown> = {}) => (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input className={inputCls} value={form[k]} onChange={set(k)} {...props} />
    </label>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-xl px-3 sm:px-4 pt-4 pb-28 md:pb-10 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('business.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('business.subtitle')}</p>
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}

        {!loading && latest && (
          <section className={cn('rounded-2xl p-4 space-y-2 border border-neutral-200/70', STATUS_STYLE[latest.status])}>
            <p className="text-xs uppercase tracking-wide opacity-70">{t('business.statusTitle')}</p>
            <p className="font-semibold">{latest.companyName} — {t(`business.status.${latest.status}`)}</p>
            <p className="text-xs opacity-70">{t('business.submittedAt')}: {formatDate(latest.createdAt)}</p>
            {latest.status === 'pending' && <p className="text-sm">{t('business.pendingHint')}</p>}
            {latest.status === 'approved' && (
              <>
                <p className="text-sm">{t('business.approvedHint')}</p>
                {latest.proposedRewardPercent !== null && (
                  <p className="text-sm font-medium">{t('business.reward')}: {latest.proposedRewardPercent.toLocaleString(locale === 'uk' ? 'uk-UA' : 'en')}%
                    <span className="block text-xs font-normal opacity-80 mt-0.5">{t('business.rewardNote')}</span>
                  </p>
                )}
              </>
            )}
            {latest.status === 'rejected' && latest.rejectReason && <p className="text-sm">{t('business.reason')}: {latest.rejectReason}</p>}
            {latest.status === 'rejected' && !showForm && (
              <button type="button" onClick={() => setShowForm(true)} className="mt-1 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2">{t('business.reapply')}</button>
            )}
          </section>
        )}

        {!loading && formVisible && (
          <form onSubmit={submit} className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-4 space-y-3">
            {field('companyName', t('business.fields.companyName'), { required: true, maxLength: 150 })}
            {field('activity', t('business.fields.activity'), { required: true, maxLength: 150 })}
            {field('city', t('business.fields.city'), { required: true, maxLength: 100 })}
            {field('contactName', t('business.fields.contactName'), { maxLength: 100 })}
            {field('phone', t('business.fields.phone'), { required: true, type: 'tel', inputMode: 'tel', maxLength: 30 })}
            {field('website', t('business.fields.website'), { maxLength: 255, inputMode: 'url' })}
            <label className="block space-y-1">
              <span className="text-sm font-medium text-neutral-700">{t('business.fields.project')}</span>
              <select className={inputCls} value={form.projectSlug} onChange={set('projectSlug')}>
                <option value="">{t('business.fields.projectNone')}</option>
                {projects.map((p) => <option key={p.slug} value={p.slug}>{(locale === 'uk' ? p.nameUk : p.nameEn) || p.nameUk}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-neutral-700">{t('business.fields.description')}</span>
              <textarea className={inputCls} rows={5} required minLength={20} maxLength={3000} value={form.description} onChange={set('description')} />
              <span className="text-xs text-neutral-400">{t('business.hints.description')}</span>
            </label>
            <button type="submit" disabled={sending} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 disabled:opacity-60 flex items-center justify-center gap-2">
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}{sending ? t('business.sending') : t('business.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
