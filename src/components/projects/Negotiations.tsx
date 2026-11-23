'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';

interface Row { id: number; title: string; product: string | null; status: string; updatedAt: string; mine: boolean; with: string }
interface Neg { id: number; title: string; product: string | null; volume: string | null; price: string | null; payTerms: string | null; delivery: string | null; status: string; mine: boolean; with: string; withId: number; myAgreed: boolean; otherAgreed: boolean }
interface Msg { id: number; mine: boolean; kind: string; text: string; attachmentUrl: string | null; createdAt: string }
interface Found { id: number; name: string }

const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';
const card = 'rounded-2xl bg-white p-4 shadow-md space-y-3';

/** Переговори проєкту: список (активні / отримані), створення (вибір партнера з пошуку) і робочий простір угоди. Гроші система не рухає. */
export function Negotiations({ project, mode }: { project: string; mode: 'active' | 'received' | 'new' }) {
  const { t, formatDate } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const box = mode === 'received' ? 'received' : mode === 'new' ? 'started' : 'all';

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const r = await fetch(`/api/negotiations?project=${encodeURIComponent(project)}&box=${box}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (!r.ok) throw new Error();
      setRows((await r.json()).items as Row[]);
    } catch { setFailed(true); setRows([]); }
  }, [project, box]);
  useEffect(() => { load(); }, [load]);

  if (openId) return <Workspace id={openId} onBack={() => { setOpenId(null); load(); }} />;
  const shown = mode === 'active' && rows ? rows.filter((r) => r.status === 'open' || r.status === 'active') : rows;
  return (
    <div className="space-y-3">
      {mode === 'new' && <CreateForm project={project} onCreated={(id) => setOpenId(id)} />}
      {!shown && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>}
      {failed && <p className="rounded-2xl bg-white p-4 text-sm text-red-600">{t('listings.common.loadFailed')}</p>}
      {shown && !failed && shown.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-neutral-600">{t('projects.neg.empty')}</p>}
      <ul className="space-y-2">
        {shown?.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => setOpenId(r.id)} className="w-full text-left rounded-2xl bg-white p-3 shadow-md space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-neutral-500">№{r.id} · {formatDate(r.updatedAt)}</span>
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-800">{t(`projects.neg.status.${r.status}`)}</span>
              </div>
              <p className="font-bold text-neutral-900 break-words">{r.title}</p>
              <p className="text-xs text-neutral-600">{r.mine ? t('projects.neg.to') : t('projects.neg.from')}: {r.with}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreateForm({ project, onCreated }: { project: string; onCreated: (id: number) => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Found[]>([]);
  const [partner, setPartner] = useState<Found | null>(null);
  const [v, setV] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: string, val: string) => setV((p) => ({ ...p, [k]: val }));

  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return; }
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?${new URLSearchParams({ q: q.trim(), type: 'all' })}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        if (!r.ok) return;
        const d = await r.json();
        const people: Found[] = (d.people || []).map((p: any) => ({ id: p.id, name: `${p.firstName || ''} ${p.lastName || ''}`.trim() }));
        const biz: Found[] = (d.business || []).map((b: any) => ({ id: b.userId, name: b.companyName }));
        setFound(biz.concat(people).filter((x) => x.id && x.name).slice(0, 8));
      } catch { /* ignore */ }
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!partner || busy) { if (!partner) toast.error(t('projects.neg.pickPartner')); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/negotiations', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ projectSlug: project, partnerId: partner.id, ...v }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error();
      toast.success(t('projects.neg.created'));
      onCreated(d.id);
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className={card}>
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{t('projects.neg.partner')}</p>
      {partner ? (
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-sm">
          <span className="font-semibold">{partner.name}</span>
          <button type="button" onClick={() => setPartner(null)} className="text-xs text-primary-700 underline">{t('projects.neg.change')}</button>
        </div>
      ) : (
        <>
          <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder={t('projects.neg.search')} aria-label={t('projects.neg.search')} className={inputCls} />
          {found.length > 0 && <ul className="rounded-xl border border-neutral-200 divide-y">{found.map((f) => <li key={`${f.id}-${f.name}`}><button type="button" onClick={() => { setPartner(f); setQ(''); setFound([]); }} className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50">{f.name}</button></li>)}</ul>}
        </>
      )}
      <input required value={v.title || ''} onChange={(e) => set('title', e.target.value)} maxLength={150} placeholder={`${t('projects.neg.titleField')} *`} aria-label={t('projects.neg.titleField')} className={inputCls} />
      {(['product', 'volume', 'price', 'payTerms', 'delivery'] as const).map((k) => (
        <input key={k} value={v[k] || ''} onChange={(e) => set(k, e.target.value)} maxLength={k === 'payTerms' || k === 'delivery' ? 200 : 150} placeholder={t(`projects.neg.f.${k}`)} aria-label={t(`projects.neg.f.${k}`)} className={inputCls} />
      ))}
      <textarea value={v.text || ''} onChange={(e) => set('text', e.target.value)} maxLength={2000} rows={3} placeholder={t('projects.neg.firstMessage')} aria-label={t('projects.neg.firstMessage')} className={inputCls} />
      <button type="submit" disabled={busy} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 font-bold py-2.5 disabled:opacity-50 inline-flex items-center justify-center gap-2">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}{t('projects.neg.start')}
      </button>
      <p className="text-xs text-neutral-500">{t('projects.neg.noMoney')}</p>
    </form>
  );
}

function Workspace({ id, onBack }: { id: number; onBack: () => void }) {
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const [neg, setNeg] = useState<Neg | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [failed, setFailed] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [terms, setTerms] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/negotiations/${id}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setNeg(d.negotiation); setMsgs(d.messages);
    } catch { setFailed(true); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (body: Record<string, unknown>) => {
    if (busy) return false;
    setBusy(true);
    try {
      const r = await fetch(`/api/negotiations/${id}`, { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(body) });
      if (!r.ok) throw new Error();
      await load();
      return true;
    } catch { toast.error(t('feed.toast.actionFailed')); return false; } finally { setBusy(false); }
  };

  const send = async (e: FormEvent) => { e.preventDefault(); if (text.trim() && await act({ action: 'message', text })) setText(''); };
  const attach = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append('file', file); form.append('type', 'misc');
      const r = await fetch('/api/upload', { method: 'POST', credentials: 'include', headers: authHeaders(), body: form });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error(d.error);
      await act({ action: 'message', text: file.name.slice(0, 100), attachmentUrl: d.url });
    } catch (e: any) { toast.error(e?.message || t('feed.toast.actionFailed')); }
  };
  const saveTerms = async (e: FormEvent) => { e.preventDefault(); if (await act({ action: 'terms', ...terms })) setEditing(false); };

  if (failed) return <div className="space-y-3"><button type="button" onClick={onBack} className="rounded-full bg-white/90 text-sm font-semibold px-3 py-1.5">{t('cabinet.foldersUi.back')}</button><p className="rounded-2xl bg-white p-4 text-sm text-red-600">{t('listings.common.loadFailed')}</p></div>;
  if (!neg) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>;
  const closed = neg.status === 'declined' || neg.status === 'closed';
  const locked = closed || neg.status === 'agreed';
  const eventText = (m: Msg) => m.kind === 'status' ? t(`projects.neg.event.${m.text}`) : m.text;

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full bg-white/90 text-sm font-semibold text-neutral-800 px-3 py-1.5">← {t('cabinet.foldersUi.back')}</button>
      <section className={card}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><p className="text-xs text-neutral-500">№{neg.id}</p><h3 className="font-bold text-neutral-900 break-words">{neg.title}</h3>
            <p className="text-xs text-neutral-600">{neg.mine ? t('projects.neg.to') : t('projects.neg.from')}: <Link href={`/profile/${neg.withId}`} className="underline">{neg.with}</Link></p></div>
          <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-800">{t(`projects.neg.status.${neg.status}`)}</span>
        </div>
        {!editing && (
          <dl className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 space-y-1 text-sm">
            {(['product', 'volume', 'price', 'payTerms', 'delivery'] as const).map((k) => <div key={k} className="flex gap-2"><dt className="text-neutral-500 shrink-0">{t(`projects.neg.f.${k}`)}:</dt><dd className="break-words">{neg[k] || '—'}</dd></div>)}
          </dl>
        )}
        {editing && (
          <form onSubmit={saveTerms} className="space-y-2">
            {(['product', 'volume', 'price', 'payTerms', 'delivery'] as const).map((k) => <input key={k} value={terms[k] ?? ''} onChange={(e) => setTerms((p) => ({ ...p, [k]: e.target.value }))} maxLength={k === 'payTerms' || k === 'delivery' ? 200 : 150} placeholder={t(`projects.neg.f.${k}`)} aria-label={t(`projects.neg.f.${k}`)} className={inputCls} />)}
            <div className="flex gap-2"><button type="button" onClick={() => setEditing(false)} className="rounded-full border border-neutral-300 px-4 py-2 font-bold">{t('projects.f.back')}</button><button type="submit" disabled={busy} className="flex-1 rounded-full bg-primary-500 font-bold py-2 disabled:opacity-50">{t('projects.neg.saveTerms')}</button></div>
            <p className="text-xs text-neutral-500">{t('projects.neg.termsReset')}</p>
          </form>
        )}
        {!locked && !editing && (
          <div className="flex flex-wrap gap-2">
            {neg.status === 'open' && !neg.mine && <button type="button" disabled={busy} onClick={() => act({ action: 'status', status: 'active' })} className="rounded-full bg-primary-500 font-bold px-4 py-1.5 text-sm">{t('projects.neg.accept')}</button>}
            <button type="button" onClick={() => { setTerms({ product: neg.product || '', volume: neg.volume || '', price: neg.price || '', payTerms: neg.payTerms || '', delivery: neg.delivery || '' }); setEditing(true); }} className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-semibold">{t('projects.neg.editTerms')}</button>
            {neg.status === 'active' && !neg.myAgreed && <button type="button" disabled={busy} onClick={() => act({ action: 'agree' })} className="rounded-full bg-emerald-500 text-white font-bold px-4 py-1.5 text-sm">{t('projects.neg.agree')}</button>}
            <button type="button" disabled={busy} onClick={() => act({ action: 'status', status: 'declined' })} className="rounded-full border border-red-300 text-red-700 px-4 py-1.5 text-sm font-semibold">{t('projects.neg.decline')}</button>
          </div>
        )}
        {neg.status === 'active' && (neg.myAgreed || neg.otherAgreed) && <p className="text-xs text-neutral-600">{neg.myAgreed ? t('projects.neg.youAgreed') : t('projects.neg.otherAgreed')}</p>}
        {neg.status === 'agreed' && <p className="text-xs text-emerald-700 font-semibold">{t('projects.neg.agreedNote')}</p>}
      </section>
      <section className={card}>
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{t('projects.neg.history')}</p>
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {msgs.length === 0 && <li className="text-sm text-neutral-500">{t('projects.neg.noMessages')}</li>}
          {msgs.map((m) => (
            <li key={m.id} className={`rounded-xl px-3 py-2 text-sm ${m.kind !== 'text' ? 'bg-amber-50 border border-amber-200 text-amber-900' : m.mine ? 'bg-primary-50 ml-6' : 'bg-neutral-100 mr-6'}`}>
              {m.kind === 'terms' && <span className="block text-xs font-bold">{t('projects.neg.termsChanged')}</span>}
              <span className="break-words whitespace-pre-wrap">{eventText(m)}</span>
              {m.attachmentUrl && <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mt-1"><img src={m.attachmentUrl} alt={m.text} className="max-h-48 rounded-lg" /></a>}
              <span className="block text-[11px] text-neutral-500 mt-0.5">{m.mine ? t('projects.neg.you') : neg.with} · {formatDate(m.createdAt)}</span>
            </li>
          ))}
        </ul>
        {!closed && (
          <form onSubmit={send} className="space-y-2">
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={2} placeholder={t('projects.neg.write')} aria-label={t('projects.neg.write')} className={inputCls} />
            <div className="flex gap-2">
              <label className="cursor-pointer rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800">📎 {t('projects.neg.attach')}<input type="file" accept="image/*" hidden onChange={(e) => { attach(e.target.files); e.target.value = ''; }} /></label>
              <button type="submit" disabled={busy || !text.trim()} className="flex-1 rounded-full bg-primary-500 hover:bg-primary-600 font-bold py-2 disabled:opacity-50">{t('projects.neg.send')}</button>
            </div>
            <p className="text-xs text-neutral-500">{t('projects.neg.attachNote')}</p>
          </form>
        )}
      </section>
    </div>
  );
}
