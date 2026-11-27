'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';
import { childLevel, RepLevel, RepPerson } from '@/lib/rep';
import { askConfirm } from '@/components/ui/ConfirmHost';

const PROJECT = 'lawyers';
interface Unit { id: number; parentId: number | null; level: RepLevel; name: string; flag: string | null; isActive: boolean; leader: RepPerson | null }
interface App { id: number; kind: string; placeName: string | null; message: string; phone: string | null; specialization: string | null; status: string; unit: { id: number; name: string; level: string } | null; applicant: RepPerson | null }

const inputCls = 'rounded-lg border border-neutral-300 px-2 py-1.5 text-sm';

/** Адмін: дерево представництв (країна → область → район → громада), призначення керівників і загальна черга заявок. */
export default function AdminRepresentationsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [adding, setAdding] = useState<number | 'root' | null>(null);
  const [newName, setNewName] = useState('');
  const [newFlag, setNewFlag] = useState('');
  const [emails, setEmails] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    try {
      const h = { credentials: 'include' as const, headers: authHeaders(), cache: 'no-store' as const };
      const u = await fetch(`/api/admin/rep/units?project=${PROJECT}`, h);
      if (u.status === 401 || u.status === 403) { setForbidden(true); return; }
      setUnits((await u.json()).units);
      const a = await fetch(`/api/admin/rep/applications?project=${PROJECT}&queue=general&status=new`, h);
      if (a.ok) setApps((await a.json()).applications);
    } catch { toast.error(t('projects.rep.admin.failed')); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);

  const call = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, { method, credentials: 'include', headers: jsonHeaders(), body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(data.error || t('projects.rep.admin.failed')); return false; }
    toast.success(t('projects.rep.admin.saved'));
    await load();
    return true;
  };

  const add = async () => {
    if (adding === null) return;
    const ok = await call('/api/admin/rep/units', 'POST', { project: PROJECT, parentId: adding === 'root' ? undefined : adding, name: newName, flag: newFlag || undefined });
    if (ok) { setAdding(null); setNewName(''); setNewFlag(''); }
  };

  const decide = async (id: number, status: 'accepted' | 'rejected') => { await call(`/api/rep/applications/${id}`, 'PATCH', { status }); };

  const addForm = (key: number | 'root') => adding === key && (
    <div className="flex flex-wrap gap-2 items-center mt-2">
      <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('projects.rep.admin.name')} maxLength={120} className={`${inputCls} flex-1 min-w-[10rem]`} />
      {(key === 'root') && <input value={newFlag} onChange={(e) => setNewFlag(e.target.value)} placeholder={t('projects.rep.admin.flag')} maxLength={8} className={`${inputCls} w-28`} />}
      <button type="button" onClick={add} className="rounded-lg bg-primary-500 hover:bg-primary-600 font-semibold text-sm px-3 py-1.5">{t('projects.rep.admin.add')}</button>
    </div>
  );

  const renderUnit = (u: Unit, depth: number) => {
    const kids = units.filter((x) => x.parentId === u.id);
    const canAddChild = !!childLevel(u.level);
    return (
      <li key={u.id}>
        <div className="bg-white rounded-xl border border-neutral-200 p-3 space-y-2" style={{ marginLeft: depth * 16 }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-neutral-900">{u.flag ? `${u.flag} ` : ''}{u.name}</span>
            <span className="text-xs text-neutral-500">{t(`projects.rep.levels.${u.level}`)}</span>
            <span className="text-xs text-neutral-600 ml-auto">{u.leader ? `${t('projects.rep.admin.leader')}: ${u.leader.name}` : t('projects.rep.admin.noLeader')}</span>
            <button type="button" aria-label={t('projects.rep.admin.delete')} title={t('projects.rep.admin.delete')} onClick={async () => { if (await askConfirm(t('projects.rep.admin.confirmDelete', { name: u.name }))) call(`/api/admin/rep/units/${u.id}`, 'DELETE'); }} className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input type="email" value={emails[u.id] ?? ''} onChange={(e) => setEmails((p) => ({ ...p, [u.id]: e.target.value }))} placeholder={t('projects.rep.admin.leaderEmail')} className={`${inputCls} flex-1 min-w-[10rem]`} />
            <button type="button" disabled={!(emails[u.id] || '').trim()} onClick={async () => { if (await call(`/api/admin/rep/units/${u.id}`, 'PATCH', { leaderEmail: emails[u.id] })) setEmails((p) => ({ ...p, [u.id]: '' })); }} className="rounded-lg bg-neutral-900 text-white text-sm font-semibold px-3 py-1.5 disabled:opacity-40">{t('projects.rep.admin.setLeader')}</button>
            {u.leader && <button type="button" onClick={() => call(`/api/admin/rep/units/${u.id}`, 'PATCH', { leaderEmail: '' })} className="rounded-lg border border-neutral-300 text-sm font-semibold px-3 py-1.5">{t('projects.rep.admin.removeLeader')}</button>}
            {canAddChild && <button type="button" onClick={() => { setAdding(adding === u.id ? null : u.id); setNewName(''); }} className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 text-sm font-semibold px-3 py-1.5"><Plus className="w-4 h-4" />{t('projects.rep.admin.child')}</button>}
          </div>
          {addForm(u.id)}
        </div>
        {kids.length > 0 && <ul className="mt-2 space-y-2">{kids.map((k) => renderUnit(k, depth + 1))}</ul>}
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-700"><ArrowLeft className="w-4 h-4" />{t('projects.rep.admin.back')}</Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('projects.rep.admin.title')}</h1>
          <p className="text-sm text-neutral-500">{t('projects.rep.admin.subtitle')}</p>
        </div>
        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {forbidden && <p className="text-red-600 text-sm">{t('projects.rep.admin.forbidden')}</p>}

        {!loading && !forbidden && (
          <>
            <section className="space-y-2">
              <h2 className="font-semibold text-neutral-800">{t('projects.rep.admin.queue')}</h2>
              {apps.length === 0 && <p className="text-sm text-neutral-600">{t('projects.rep.admin.queueEmpty')}</p>}
              <ul className="space-y-2">
                {apps.map((a) => (
                  <li key={a.id} className="bg-white rounded-xl border border-neutral-200 p-3 space-y-1">
                    <p className="text-sm font-bold text-neutral-900">{t(`projects.rep.kinds.${a.kind}`)} · {a.applicant?.name}</p>
                    <p className="text-xs text-neutral-500">{[a.unit?.name, a.placeName, a.specialization, a.phone].filter(Boolean).join(' · ')}</p>
                    <p className="text-sm text-neutral-800 whitespace-pre-line">{a.message}</p>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => decide(a.id, 'accepted')} className="rounded-full bg-primary-500 hover:bg-primary-600 font-bold px-4 py-1.5 text-sm">{t('projects.rep.leaderPage.accept')}</button>
                      <button type="button" onClick={() => decide(a.id, 'rejected')} className="rounded-full bg-neutral-100 font-semibold px-4 py-1.5 text-sm text-neutral-700">{t('projects.rep.leaderPage.reject')}</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setAdding(adding === 'root' ? null : 'root'); setNewName(''); setNewFlag(''); }} className="inline-flex items-center gap-1 rounded-lg bg-primary-500 hover:bg-primary-600 font-semibold text-sm px-3 py-1.5"><Plus className="w-4 h-4" />{t('projects.rep.admin.addCountry')}</button>
              </div>
              {addForm('root')}
              <ul className="space-y-2">{units.filter((u) => u.parentId === null).map((u) => renderUnit(u, 0))}</ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
