'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { jsonHeaders, readStoredUser } from '@/lib/feedClient';

/** Калькулятор «закупівля під ключ»: орієнтовна собівартість одиниці й усієї партії. Курс юаня вводить сама людина. */
type K = 'price' | 'qty' | 'rate' | 'payFee' | 'chinaDelivery' | 'agentPct' | 'qc' | 'intl' | 'customs' | 'other';
const FIELDS: { key: K; unit: 'cny' | 'uah' | 'pct' | 'pcs' }[] = [
  { key: 'price', unit: 'cny' }, { key: 'qty', unit: 'pcs' }, { key: 'rate', unit: 'uah' }, { key: 'payFee', unit: 'pct' },
  { key: 'chinaDelivery', unit: 'cny' }, { key: 'agentPct', unit: 'pct' }, { key: 'qc', unit: 'cny' },
  { key: 'intl', unit: 'uah' }, { key: 'customs', unit: 'uah' }, { key: 'other', unit: 'uah' },
];
const num = (v: string) => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : 0; };
const money = (n: number) => new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(n);

export default function ChinaCalculatorPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [v, setV] = useState<Record<K, string>>({ price: '', qty: '', rate: '', payFee: '', chinaDelivery: '', agentPct: '', qc: '', intl: '', customs: '', other: '' });
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);

  const r = useMemo(() => {
    const goodsCny = num(v.price) * num(v.qty);
    const rate = num(v.rate);
    const goods = goodsCny * rate;
    const payFee = goods * num(v.payFee) / 100;
    const inChina = num(v.chinaDelivery) * rate;
    const agent = goods * num(v.agentPct) / 100;
    const qc = num(v.qc) * rate;
    const total = goods + payFee + inChina + agent + qc + num(v.intl) + num(v.customs) + num(v.other);
    const qty = num(v.qty);
    return { goods, payFee, inChina, agent, qc, total, perUnit: qty ? total / qty : 0, ready: goodsCny > 0 && rate > 0 };
  }, [v]);

  const rows: { label: string; value: number }[] = [
    { label: t('projects.china.calc.rows.goods'), value: r.goods }, { label: t('projects.china.calc.rows.payFee'), value: r.payFee },
    { label: t('projects.china.calc.rows.inChina'), value: r.inChina }, { label: t('projects.china.calc.rows.agent'), value: r.agent },
    { label: t('projects.china.calc.rows.qc'), value: r.qc }, { label: t('projects.china.calc.rows.intl'), value: num(v.intl) },
    { label: t('projects.china.calc.rows.customs'), value: num(v.customs) }, { label: t('projects.china.calc.rows.other'), value: num(v.other) },
  ];

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (sending || !r.ready) return;
    if (!readStoredUser()) { window.location.assign('/auth/login?returnUrl=/projects/china/calculator'); return; }
    if (!/^\+?[0-9 ()-]{7,30}$/.test(phone.trim())) { toast.error(t('projects.china.phoneInvalid')); return; }
    setSending(true);
    try {
      const text = `${t('projects.china.calc.summary', { qty: num(v.qty), price: num(v.price), rate: num(v.rate), total: money(r.total), unit: money(r.perUnit) })} | ${t('projects.china.phone')}: ${phone.trim()}`.slice(0, 1000);
      const res = await fetch('/api/project-suggestions', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ projectSlug: 'china', kind: 'calc', text }) });
      if (!res.ok) throw new Error();
      toast.success(t('projects.china.sent'));
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-xl px-3 sm:px-6 pt-4 pb-28 space-y-4">
        <Link href="/projects/china" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700"><ArrowLeft className="w-4 h-4" />{t('projects.china.calc.back')}</Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('projects.china.calc.title')}</h1>
          <p className="text-sm text-neutral-600 mt-1">{t('projects.china.calc.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white rounded-2xl shadow-sm p-4">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm font-medium text-neutral-700">{t(`projects.china.calc.fields.${f.key}`)} <span className="text-neutral-400">({t(`projects.china.calc.units.${f.unit}`)})</span></span>
              <input type="text" inputMode="decimal" value={v[f.key]} onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))} maxLength={14}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </label>
          ))}
        </div>
        <p className="text-xs text-neutral-500">{t('projects.china.calc.rateHint')}</p>

        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2" aria-live="polite">
          <h2 className="font-bold text-neutral-900">{t('projects.china.calc.result')}</h2>
          <ul className="text-sm text-neutral-700 divide-y divide-neutral-100">
            {rows.map((row) => <li key={row.label} className="flex justify-between py-1.5"><span>{row.label}</span><span className="font-medium">{money(row.value)}</span></li>)}
          </ul>
          <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200">
            <span className="font-bold text-neutral-900">{t('projects.china.calc.total')}</span>
            <span className="text-xl font-extrabold text-primary-700">{r.ready ? money(r.total) : '-'}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-neutral-900">{t('projects.china.calc.perUnit')}</span>
            <span className="text-lg font-bold text-neutral-900">{r.ready && r.perUnit ? money(r.perUnit) : '-'}</span>
          </div>
          <p className="text-xs text-neutral-500 pt-1">{t('projects.china.calc.disclaimer')}</p>
        </div>

        <form onSubmit={send} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <p className="text-sm text-neutral-700">{t('projects.china.calc.sendHint')}</p>
          <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder={t('projects.china.phone')} aria-label={t('projects.china.phone')}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          <button type="submit" disabled={sending || !r.ready} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 font-bold py-3 disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}{t('projects.china.calc.send')}
          </button>
        </form>
      </div>
    </div>
  );
}
