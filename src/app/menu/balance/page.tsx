'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flower2, Gift, Heart, Coins, Loader2, Star } from 'lucide-react';
import { MenuShell } from '@/components/cabinet/MenuShell';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';

function UnlockRequest() {
  const { t } = useI18n();
  const toast = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || text.trim().length < 5) return;
    setBusy(true);
    try {
      const r = await fetch('/api/project-suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ projectSlug: 'platform', kind: 'unlock', text }) });
      if (!r.ok) throw new Error('fail');
      setText('');
      toast.success(t('cabinet.balance.unlockDone'));
    } catch {
      toast.error(t('cabinet.balance.unlockFail'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={send} className="rounded-2xl bg-white border border-neutral-200/70 p-4 space-y-2">
      <h2 className="font-bold text-neutral-900">{t('cabinet.balance.unlockTitle')}</h2>
      <p className="text-xs text-neutral-500">{t('cabinet.balance.unlockNote')}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} placeholder={t('cabinet.balance.unlockPh')} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base md:text-sm" />
      <button type="submit" disabled={busy || text.trim().length < 5} className="rounded-xl bg-primary-500 hover:bg-primary-600 text-neutral-900 font-bold px-5 py-2 disabled:opacity-50">{t('cabinet.balance.unlockSend')}</button>
    </form>
  );
}

interface Cabinet { invited: number; completedDeals: number; isActiveParticipant: boolean }

/** Баланс: кількість запрошених, завершені угоди, статус; гаманець і подарунки — «Скоро». */
export default function BalancePage() {
  const { t } = useI18n();
  const toast = useToast();
  const [c, setC] = useState<Cabinet | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = () => {
    setState('loading');
    fetch('/api/me/cabinet', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setC(d); setState('ready'); }).catch(() => setState('error'));
  };
  useEffect(load, []);

  const soon = () => toast.info(t('cabinet.shell.soonToast'));
  const gifts = [
    { k: 'coins', icon: Coins }, { k: 'flowers', icon: Flower2 }, { k: 'hearts', icon: Heart }, { k: 'prizes', icon: Gift },
  ] as const;

  return (
    <MenuShell title={t('cabinet.balance.title')}>
      {state === 'loading' && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
      {state === 'error' && <div className="rounded-2xl bg-white border border-red-100 p-5 text-center space-y-3"><p className="text-sm text-red-600">{t('cabinet.shell.error')}</p><button onClick={load} className="rounded-full bg-primary-500 text-white font-semibold px-5 py-2 text-sm">{t('cabinet.shell.retry')}</button></div>}
      {state === 'ready' && c && (
        <>
          <section className="rounded-3xl p-5 text-white bg-gradient-to-br from-[#0b2a6b] via-[#123b8f] to-[#0a1f44] shadow-lg">
            <p className="text-sm text-white/70">{t('cabinet.balance.wallet')}</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight">0,00 ₴</p>
            <p className="mt-2 text-xs text-white/70">{t('cabinet.balance.walletNote')}</p>
            <button type="button" onClick={soon} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-500 text-neutral-900 font-bold px-5 py-2 text-sm">
              {t('cabinet.balance.topUp')} <span className="rounded-full bg-black/15 text-[10px] uppercase px-2 py-0.5">{t('cabinet.shell.soon')}</span>
            </button>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white border border-neutral-200/70 p-4 text-center">
              <p className="text-3xl font-extrabold text-accent-700">{c.invited}</p>
              <p className="text-xs text-neutral-500 mt-1">{t('cabinet.balance.invited')}</p>
            </div>
            <div className="rounded-2xl bg-white border border-neutral-200/70 p-4 text-center">
              <p className="text-3xl font-extrabold text-accent-700">{c.completedDeals}</p>
              <p className="text-xs text-neutral-500 mt-1">{t('cabinet.balance.deals')}</p>
            </div>
          </section>

          <section className={`rounded-2xl border p-4 flex items-start gap-3 ${c.isActiveParticipant ? 'bg-primary-50 border-primary-200' : 'bg-white border-neutral-200/70'}`}>
            <Star className={`w-6 h-6 shrink-0 ${c.isActiveParticipant ? 'fill-primary-500 text-primary-600' : 'text-neutral-400'}`} />
            <div>
              <p className="text-xs text-neutral-500">{t('cabinet.balance.status')}</p>
              <p className="font-bold text-neutral-900">{c.isActiveParticipant ? t('cabinet.balance.active') : t('cabinet.balance.inactive')}</p>
              <p className="text-sm text-neutral-600 mt-0.5">{c.isActiveParticipant ? t('cabinet.balance.activeHint') : t('cabinet.balance.inactiveHint')}</p>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/menu/qr" className="rounded-2xl bg-primary-500 hover:bg-primary-600 text-neutral-900 font-bold text-center py-3">{t('cabinet.balance.invite')}</Link>
            <Link href="/earnings" className="rounded-2xl bg-white border border-neutral-200 font-bold text-center py-3 text-neutral-800 hover:bg-neutral-50">{t('cabinet.balance.myDeals')}</Link>
          </div>

          <section className="rounded-2xl bg-white border border-neutral-200/70 p-4">
            <h2 className="font-bold text-neutral-900">{t('cabinet.balance.giftsTitle')}</h2>
            <p className="text-xs text-neutral-500 mt-1">{t('cabinet.balance.giftsNote')}</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {gifts.map(({ k, icon: Icon }) => (
                <button key={k} type="button" onClick={soon} className="rounded-xl bg-neutral-50 border border-neutral-200 py-3 flex flex-col items-center gap-1 opacity-80">
                  <Icon className="w-6 h-6 text-accent-600" />
                  <span className="text-[11px] font-medium text-neutral-700">{t(`cabinet.balance.gift.${k}`)}</span>
                </button>
              ))}
            </div>
          </section>

          <UnlockRequest />
        </>
      )}
    </MenuShell>
  );
}
