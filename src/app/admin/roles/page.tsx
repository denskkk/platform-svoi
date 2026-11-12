'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';

interface Staff { userId: number; role: string; name: string; email: string }
const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-400';

export default function AdminRolesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const [roles, setRoles] = useState<string[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('moderator');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/roles', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?returnUrl=/admin/roles'); return; }
      if (res.status === 403) { setForbidden(true); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRoles(data.roles);
      setStaff(data.staff);
    } catch {
      toast.error(t('staff.manage.failed'));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/admin/roles'); return; }
    load();
  }, [router, load]);

  const send = async (targetEmail: string, targetRole: string | null) => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/roles', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ email: targetEmail, role: targetRole }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || t('staff.manage.failed')); return; }
      toast.success(t('staff.manage.saved'));
      if (targetRole !== null) setEmail('');
      await load();
    } catch {
      toast.error(t('staff.manage.failed'));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => { e.preventDefault(); if (email.trim() && !busy) send(email.trim(), role); };

  if (forbidden) return <div className="mx-auto max-w-xl p-8 text-center text-neutral-600">{t('staff.manage.forbidden')}</div>;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-2xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('staff.manage.back')}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('staff.manage.title')}</h1>
          <p className="text-sm text-neutral-500">{t('staff.manage.subtitle')}</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-4 space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-neutral-700">{t('staff.manage.email')}</span>
            <input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-neutral-700">{t('staff.manage.role')}</span>
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => <option key={r} value={r}>{t(`staff.roles.${r}`)} — {t(`staff.manage.perms.${r}`)}</option>)}
            </select>
          </label>
          <button type="submit" disabled={busy || !email.trim()} className="rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-2.5 disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t('staff.manage.assign')}
          </button>
        </form>

        {loading && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {!loading && staff.length === 0 && <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center text-neutral-600">{t('staff.manage.empty')}</div>}
        <ul className="space-y-2">
          {staff.map((s) => (
            <li key={s.userId} className="bg-white rounded-2xl border border-neutral-200/70 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-neutral-900 truncate">{s.name}</p>
                <p className="text-xs text-neutral-500 truncate">{s.email} · {t(`staff.roles.${s.role}`)}</p>
              </div>
              <button type="button" disabled={busy} onClick={() => send(s.email, null)} className="shrink-0 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold px-4 py-1.5 disabled:opacity-60">{t('staff.manage.revoke')}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
