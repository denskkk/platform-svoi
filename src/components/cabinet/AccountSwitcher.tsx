'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';

interface Acc { id: number; name: string; avatarUrl: string | null; accountType: string }

/** Перемикач «особистий ↔ бізнес»: дописи й кабінет від імені обраного акаунта без повторного входу. */
export function AccountSwitcher() {
  const { t } = useI18n();
  const toast = useToast();
  const [accounts, setAccounts] = useState<Acc[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const me = readStoredUser();

  const load = useCallback(() => {
    fetch('/api/me/linked-accounts', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null)).then((d) => d && setAccounts(d.accounts)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const switchTo = async (id: number) => {
    if (busy) return;
    setBusy(id);
    try {
      const res = await fetch('/api/auth/switch', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ userId: id }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      localStorage.setItem('user', JSON.stringify(d.user));
      localStorage.setItem('token', d.token);
      window.dispatchEvent(new Event('auth:changed'));
      window.location.assign('/menu');
    } catch { toast.error(t('feed.toast.actionFailed')); setBusy(null); }
  };

  const link = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/me/linked-accounts', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(form) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error);
      setForm({ email: '', password: '' }); setAdding(false); load();
      toast.success(t('cabinet.accounts.linked'));
    } catch (err: any) { toast.error(err?.message || t('feed.toast.actionFailed')); } finally { setSaving(false); }
  };

  const unlink = async (id: number) => {
    const res = await fetch('/api/me/linked-accounts', { method: 'DELETE', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ userId: id }) });
    if (res.ok) load(); else toast.error(t('feed.toast.actionFailed'));
  };

  return (
    <section className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-4 space-y-3">
      <div>
        <h2 className="font-bold text-neutral-900">{t('cabinet.accounts.title')}</h2>
        <p className="text-xs text-neutral-500">{t('cabinet.accounts.hint')} · {t(me?.accountType === 'business' ? 'cabinet.accounts.nowBusiness' : 'cabinet.accounts.nowPersonal')}</p>
      </div>
      {accounts.map((a) => (
        <div key={a.id} className="flex items-center gap-2.5">
          <UserAvatar src={a.avatarUrl} alt={a.name} fallbackName={a.name} className="w-10 h-10 rounded-full shrink-0" />
          <span className="min-w-0 flex-1"><span className="block font-semibold truncate">{a.name}</span><span className="block text-xs text-neutral-500">{t(a.accountType === 'business' ? 'cabinet.accounts.business' : 'cabinet.accounts.personal')}</span></span>
          <button type="button" disabled={busy === a.id} onClick={() => switchTo(a.id)} className="rounded-full bg-primary-500 font-bold text-sm px-4 py-2 disabled:opacity-50">{busy === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : t('cabinet.accounts.switch')}</button>
          <button type="button" onClick={() => unlink(a.id)} className="text-xs text-neutral-500 underline">{t('cabinet.accounts.unlink')}</button>
        </div>
      ))}
      {adding ? (
        <form onSubmit={link} className="space-y-2">
          <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="E-mail" autoComplete="off" className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base md:text-sm" />
          <input type="password" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder={t('cabinet.accounts.password')} autoComplete="off" className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base md:text-sm" />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 rounded-full bg-primary-500 font-bold py-2.5 disabled:opacity-50">{t('cabinet.accounts.link')}</button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-full bg-neutral-100 font-semibold px-5">{t('cabinet.suggest.cancel')}</button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 font-semibold text-sm px-4 py-2"><Plus className="w-4 h-4" />{t('cabinet.accounts.add')}</button>
          <Link href="/auth/register/business" className="inline-flex items-center rounded-full bg-neutral-100 font-semibold text-sm px-4 py-2">{t('cabinet.accounts.create')}</Link>
        </div>
      )}
    </section>
  );
}
