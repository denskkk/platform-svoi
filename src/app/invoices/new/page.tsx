'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { MenuShell } from '@/components/cabinet/MenuShell';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';

interface Person { id: number; name: string; avatarUrl: string | null }
const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

export default function NewInvoicePage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [payer, setPayer] = useState<Person | null>(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Person[]>([]);
  const [searched, setSearched] = useState(false);
  const [form, setForm] = useState({ amount: '', currency: 'UAH', description: '', dueAt: '' });
  const [sending, setSending] = useState(false);

  // Одержувач із посилання /invoices/new?to=<id>
  useEffect(() => {
    const to = Number(new URLSearchParams(window.location.search).get('to'));
    if (!to) return;
    fetch(`/api/profile/${to}`, { credentials: 'include', headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user && setPayer({ id: d.user.id, name: d.user.businessInfo?.companyName || `${d.user.firstName} ${d.user.lastName}`.trim(), avatarUrl: d.user.avatarUrl }))
      .catch(() => {});
  }, []);

  // Пошук одержувача
  useEffect(() => {
    const s = q.trim();
    if (s.length < 2) { setFound([]); setSearched(false); return; }
    const h = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?type=people&q=${encodeURIComponent(s)}`, { credentials: 'include', headers: authHeaders() });
        const d = res.ok ? await res.json() : { people: [] };
        setFound((d.people || []).slice(0, 8).map((p: any) => ({ id: p.id, name: p.name, avatarUrl: p.avatarUrl ?? null })));
        setSearched(true);
      } catch { setFound([]); }
    }, 300);
    return () => clearTimeout(h);
  }, [q]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!payer || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/invoices', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ payerId: payer.id, amount: Number(form.amount), currency: form.currency, description: form.description, dueAt: form.dueAt || undefined }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error);
      toast.success(t('cabinet.invoices.created'));
      router.push('/invoices?tab=issued');
    } catch (err: any) {
      toast.error(err?.message || t('cabinet.invoices.failed'));
    } finally { setSending(false); }
  };

  return (
    <MenuShell title={t('cabinet.invoices.new')} backHref="/invoices">
      <form onSubmit={submit} className="space-y-3">
        <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-4 space-y-3">
          <p className="text-sm font-medium text-neutral-700">{t('cabinet.invoices.recipient')}</p>
          {payer ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-neutral-50 p-2">
              <UserAvatar src={payer.avatarUrl} alt={payer.name} fallbackName={payer.name} className="w-9 h-9 rounded-full" />
              <span className="flex-1 font-semibold truncate">{payer.name}</span>
              <button type="button" onClick={() => setPayer(null)} aria-label={t('cabinet.shell.back')} className="p-1.5 rounded-full hover:bg-neutral-200"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <>
              <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('cabinet.invoices.recipientSearch')} maxLength={80} />
              {found.length > 0 && <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">{found.map((p) => (
                <li key={p.id}><button type="button" onClick={() => { setPayer(p); setQ(''); setFound([]); }} className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-neutral-50 text-left">
                  <UserAvatar src={p.avatarUrl} alt={p.name} fallbackName={p.name} className="w-8 h-8 rounded-full" /><span className="truncate text-sm font-medium">{p.name}</span></button></li>))}</ul>}
              {searched && found.length === 0 && <p className="text-xs text-neutral-500">{t('cabinet.invoices.noResults')}</p>}
            </>
          )}
          <div className="grid grid-cols-3 gap-2">
            <label className="col-span-2 block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('cabinet.invoices.amount')}</span>
              <input className={inputCls} type="number" inputMode="decimal" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></label>
            <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('cabinet.invoices.currency')}</span>
              <select className={inputCls} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}><option>UAH</option><option>USD</option><option>EUR</option></select></label>
          </div>
          <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('cabinet.invoices.description')}</span>
            <textarea className={inputCls} rows={3} required minLength={3} maxLength={500} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></label>
          <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('cabinet.invoices.due')}</span>
            <input className={inputCls} type="date" value={form.dueAt} onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))} /></label>
          <button type="submit" disabled={!payer || sending} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 text-neutral-900 font-bold py-3 disabled:opacity-50 flex items-center justify-center gap-2">
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}{t('cabinet.invoices.create')}
          </button>
        </div>
        <p className="text-xs text-neutral-500 px-1">{t('cabinet.invoices.note')}</p>
      </form>
    </MenuShell>
  );
}
