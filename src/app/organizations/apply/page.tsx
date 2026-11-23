'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';

interface Application { id: number; name: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string; rejectReason: string | null }

const EMPTY = { name: '', direction: '', country: '', city: '', phone: '', email: '', website: '', socialLinks: '', description: '', goals: '', participation: '' };
const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-primary-50 text-primary-900',
  approved: 'bg-green-50 text-green-800',
  rejected: 'bg-red-50 text-red-700',
};
const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-400';

export default function OrganizationApplyPage() {
  const router = useRouter();
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/organization-applications', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?returnUrl=/organizations/apply'); return; }
      if (res.ok) setApps((await res.json()).applications);
    } catch {
      toast.error(t('organizations.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/organizations/apply'); return; }
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
      const res = await fetch('/api/organization-applications', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || t('organizations.failed')); return; }
      toast.success(t('organizations.success'));
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch {
      toast.error(t('organizations.failed'));
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
  const area = (k: keyof typeof EMPTY, label: string, rows: number, max: number, props: Record<string, unknown> = {}) => (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <textarea className={inputCls} rows={rows} maxLength={max} value={form[k]} onChange={set(k)} {...props} />
    </label>
  );

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto w-full max-w-xl px-3 sm:px-4 pt-4 pb-28 md:pb-10 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('organizations.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('organizations.subtitle')}</p>
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}

        {!loading && latest && (
          <section className={cn('rounded-2xl p-4 space-y-2 border border-neutral-200/70', STATUS_STYLE[latest.status])}>
            <p className="text-xs uppercase tracking-wide opacity-70">{t('organizations.statusTitle')}</p>
            <p className="font-semibold">{latest.name} — {t(`organizations.status.${latest.status}`)}</p>
            <p className="text-xs opacity-70">{t('organizations.submittedAt')}: {formatDate(latest.createdAt)}</p>
            {latest.status === 'pending' && <p className="text-sm">{t('organizations.pendingHint')}</p>}
            {latest.status === 'approved' && <p className="text-sm">{t('organizations.approvedHint')}</p>}
            {latest.status === 'rejected' && latest.rejectReason && <p className="text-sm">{t('organizations.reason')}: {latest.rejectReason}</p>}
            {latest.status === 'rejected' && !showForm && (
              <button type="button" onClick={() => setShowForm(true)} className="mt-1 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2">{t('organizations.reapply')}</button>
            )}
          </section>
        )}

        {!loading && formVisible && (
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            {field('name', t('organizations.fields.name'), { required: true, maxLength: 150 })}
            {field('direction', t('organizations.fields.direction'), { required: true, maxLength: 150 })}
            {field('country', t('organizations.fields.country'), { maxLength: 100 })}
            {field('city', t('organizations.fields.city'), { required: true, maxLength: 100 })}
            {field('phone', t('organizations.fields.phone'), { type: 'tel', inputMode: 'tel', maxLength: 30 })}
            {field('email', t('organizations.fields.email'), { type: 'email', inputMode: 'email', maxLength: 150 })}
            <p className="text-xs text-neutral-400 -mt-1">{t('organizations.hints.contact')}</p>
            {field('website', t('organizations.fields.website'), { maxLength: 255, inputMode: 'url' })}
            {field('socialLinks', t('organizations.fields.socialLinks'), { maxLength: 500 })}
            {area('description', t('organizations.fields.description'), 4, 3000, { required: true, minLength: 20 })}
            {area('goals', t('organizations.fields.goals'), 3, 2000)}
            {area('participation', t('organizations.fields.participation'), 3, 1000)}
            <button type="submit" disabled={sending} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 disabled:opacity-60 flex items-center justify-center gap-2">
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}{sending ? t('organizations.sending') : t('organizations.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
