'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus } from 'lucide-react';
import { MenuShell } from '@/components/cabinet/MenuShell';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';
import { cn } from '@/lib/utils';

interface Inv { id: number; amount: number; currency: string; description: string; status: string; dueAt: string | null; createdAt: string; isIssuer: boolean; issuer: { id: number; name: string; avatarUrl: string | null }; payer: { id: number; name: string; avatarUrl: string | null } }

const STATUS_CLS: Record<string, string> = { issued: 'bg-primary-100 text-primary-900', payer_marked: 'bg-accent-100 text-accent-800', paid: 'bg-green-100 text-green-800', cancelled: 'bg-neutral-200 text-neutral-600' };

export default function InvoicesPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [tab, setTab] = useState<'received' | 'issued'>('received');
  const [items, setItems] = useState<Inv[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async (role: string, after: number | null) => {
    try {
      const qs = new URLSearchParams({ role });
      if (after) qs.set('cursor', String(after));
      const res = await fetch(`/api/invoices?${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setItems((prev) => (after ? [...prev, ...d.invoices] : d.invoices));
      setCursor(d.nextCursor ?? null);
      setState('ready');
    } catch { setState('error'); }
  }, []);
  useEffect(() => { if (new URLSearchParams(window.location.search).get('tab') === 'issued') setTab('issued'); }, []);
  useEffect(() => { setState('loading'); load(tab, null); }, [tab, load]);

  const act = async (id: number, action: string) => {
    if (busy) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ action }) });
      if (!res.ok) throw new Error();
      toast.success(t('cabinet.invoices.actions.done'));
      await load(tab, null);
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setBusy(null); }
  };

  return (
    <MenuShell title={t('cabinet.invoices.title')} backHref="/menu">
      <Link href="/invoices/new" className="flex items-center justify-center gap-2 rounded-2xl bg-primary-500 hover:bg-primary-600 text-neutral-900 font-bold py-3 shadow-md"><Plus className="w-5 h-5" />{t('cabinet.invoices.new')}</Link>
      <div role="tablist" className="grid grid-cols-2 rounded-xl bg-white border border-neutral-200 overflow-hidden">
        {(['received', 'issued'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn('py-2.5 text-sm font-semibold', tab === k ? 'bg-space-700 text-white' : 'text-neutral-700')}>{t(`cabinet.invoices.${k}`)}</button>
        ))}
      </div>
      {state === 'loading' && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
      {state === 'error' && <div className="rounded-2xl bg-white border border-red-100 p-5 text-center space-y-3"><p className="text-sm text-red-600">{t('cabinet.shell.error')}</p><button onClick={() => load(tab, null)} className="rounded-full bg-primary-500 font-semibold px-5 py-2 text-sm">{t('cabinet.shell.retry')}</button></div>}
      {state === 'ready' && items.length === 0 && <div className="rounded-2xl bg-white border border-neutral-200 p-8 text-center text-sm text-neutral-600">{t('cabinet.invoices.empty')}</div>}
      {state === 'ready' && items.map((i) => {
        const other = i.isIssuer ? i.payer : i.issuer;
        return (
          <article key={i.id} className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-4 space-y-2">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${other.id}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                <UserAvatar src={other.avatarUrl} alt={other.name} fallbackName={other.name} className="w-10 h-10 rounded-full shrink-0" />
                <span className="min-w-0"><span className="block text-xs text-neutral-500">{i.isIssuer ? t('cabinet.invoices.to') : t('cabinet.invoices.from')}</span><span className="block font-semibold truncate">{other.name}</span></span>
              </Link>
              <span className={cn('rounded-full text-[11px] font-bold px-2.5 py-1', STATUS_CLS[i.status])}>{t(`cabinet.invoices.status.${i.status}`)}</span>
            </div>
            <p className="text-2xl font-extrabold text-neutral-900">{i.amount.toLocaleString(locale)} {i.currency}</p>
            <p className="text-sm text-neutral-700 break-words">{i.description}</p>
            <p className="text-xs text-neutral-500">{new Date(i.createdAt).toLocaleDateString(locale)}{i.dueAt ? ` · ${t('cabinet.invoices.due')}: ${new Date(i.dueAt).toLocaleDateString(locale)}` : ''}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {!i.isIssuer && i.status === 'issued' && <button disabled={busy === i.id} onClick={() => act(i.id, 'payer_marked')} className="rounded-lg bg-primary-500 font-bold text-sm px-4 py-2">{t('cabinet.invoices.actions.iPaid')}</button>}
              {i.isIssuer && (i.status === 'issued' || i.status === 'payer_marked') && <button disabled={busy === i.id} onClick={() => act(i.id, 'paid')} className="rounded-lg bg-green-600 text-white font-bold text-sm px-4 py-2">{t('cabinet.invoices.actions.confirm')}</button>}
              {i.isIssuer && (i.status === 'issued' || i.status === 'payer_marked') && <button disabled={busy === i.id} onClick={() => act(i.id, 'cancel')} className="rounded-lg bg-neutral-100 font-semibold text-sm px-4 py-2">{t('cabinet.invoices.actions.cancel')}</button>}
            </div>
          </article>
        );
      })}
      {cursor && <button onClick={() => load(tab, cursor)} className="w-full rounded-xl bg-white border border-neutral-200 py-2.5 text-sm font-semibold">{t('clubs.loadMore')}</button>}
    </MenuShell>
  );
}
