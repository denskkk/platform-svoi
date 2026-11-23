'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';
import { RepKind, RepPerson } from '@/lib/rep';
import { RepApplyForm } from './RepApplyForm';

interface Child { id: number; name: string; level: string; flag: string | null; leader: RepPerson | null; childrenCount: number; membersCount: number }
interface Member { id: number; role: string; mode: string; specialization: string | null; person: RepPerson | null }
interface Data {
  unit: { id: number; name: string; level: string; flag: string | null; leader: RepPerson | null } | null;
  ancestors: { id: number; name: string; level: string; flag: string | null }[];
  children: Child[];
  members: Member[];
  nextLevel: string | null;
  viewer: { isLeader: boolean };
}

function Avatar({ p }: { p: RepPerson | null }) {
  const cls = 'h-12 w-12 shrink-0 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center text-lg';
  return (
    <span className={cls} aria-hidden>
      {p?.avatarUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
        : '👤'}
    </span>
  );
}

/**
 * Дерево представництв: країна → область → район → громада. На кожному рівні зверху керівник (або кнопка заявки на створення),
 * нижче — наступний рівень, команда (адвокати / представники) і заявки: адвокатом, до команди, консультація.
 * Поточна одиниця живе в адресі (?unit=ID), щоб працювала кнопка «назад».
 */
export function RepTree({ project }: { project: string }) {
  const { t } = useI18n();
  const [unitId, setUnitId] = useState<number | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [form, setForm] = useState<RepKind | null>(null);

  useEffect(() => {
    const read = () => { const v = Number(new URLSearchParams(window.location.search).get('unit')); setUnitId(v > 0 ? v : null); setForm(null); };
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);

  const go = (id: number | null) => {
    const sp = new URLSearchParams(window.location.search);
    if (id) sp.set('unit', String(id)); else sp.delete('unit');
    window.history.pushState(null, '', `?${sp.toString()}`);
    setUnitId(id); setForm(null); window.scrollTo({ top: 0 });
  };

  const load = useCallback(async () => {
    setError(false); setData(null);
    try {
      const res = await fetch(`/api/rep/units?project=${encodeURIComponent(project)}${unitId ? `&unitId=${unitId}` : ''}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { setError(true); }
  }, [project, unitId]);
  useEffect(() => { load(); }, [load]);

  if (error) return <div className="rounded-2xl bg-white p-6 text-center space-y-3 shadow-md"><p className="text-sm text-red-600">{t('listings.common.loadFailed')}</p><button type="button" onClick={load} className="rounded-full bg-primary-500 font-semibold px-5 py-2">{t('listings.common.retry')}</button></div>;
  if (!data) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-white/80" /></div>;

  const { unit } = data;
  const parent = data.ancestors.length ? data.ancestors[data.ancestors.length - 1] : null;
  const leader = unit?.leader ?? null;
  const btn = 'rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95';
  const trail = unit ? data.ancestors.concat([{ id: unit.id, name: unit.name, level: unit.level, flag: unit.flag }]) : [];

  return (
    <div className="space-y-3">
      {unit && (
        <button type="button" onClick={() => go(parent ? parent.id : null)} className="inline-flex items-center gap-2 rounded-full bg-white/90 text-sm font-semibold text-neutral-800 px-3 py-1.5">
          <ArrowLeft className="w-4 h-4" /> {parent ? `${parent.flag ? `${parent.flag} ` : ''}${parent.name}` : t('projects.rep.choose.country')}
        </button>
      )}

      {unit ? (
        <header className="rounded-2xl bg-black/30 backdrop-blur border border-white/15 text-white p-4 space-y-1">
          <p className="text-xs text-white/70">{trail.map((a) => a.name).join(' › ')}</p>
          <h2 className="text-xl font-extrabold">{unit.flag ? `${unit.flag} ` : ''}{unit.name}</h2>
          <p className="text-xs text-white/70">{t(`projects.rep.levels.${unit.level}`)}</p>
        </header>
      ) : (
        <h2 className="text-lg font-bold text-white px-1">{t('projects.rep.choose.country')}</h2>
      )}

      {/* Керівник рівня */}
      {unit && (
        <section className="rounded-2xl bg-white p-4 shadow-md space-y-2" aria-label={t('projects.rep.leader')}>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('projects.rep.leaderOf', { level: t(`projects.rep.levelsOf.${unit.level}`) })}</p>
          {leader ? (
            <div className="flex items-center gap-3">
              <Avatar p={leader} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-neutral-900 truncate">{leader.name}</p>
                <Link href={`/profile/${leader.id}`} className="text-sm text-primary-700 font-semibold">{t('projects.rep.profile')}</Link>
              </div>
              {data.viewer.isLeader && <Link href={`/projects/${project}/leader`} className={`${btn} bg-primary-500 text-white`}>{t('projects.rep.openCabinet')}</Link>}
            </div>
          ) : (
            <p className="text-sm text-neutral-600">{t('projects.rep.noLeader')}</p>
          )}
        </section>
      )}

      {/* Наступний рівень */}
      {data.nextLevel && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-white px-1">{t(`projects.rep.choose.${data.nextLevel}`)}</h3>
          {data.children.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-neutral-600 shadow-md">{t('projects.rep.emptyChildren')}</p>}
          <ul className="space-y-2">
            {data.children.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => go(c.id)} className="w-full text-left rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-[0.99] transition p-3 flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>{c.flag || '📍'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-neutral-900">{c.name}</span>
                    <span className="block text-xs text-neutral-500">{c.leader ? t('projects.rep.hasLeader', { name: c.leader.name }) : t('projects.rep.noLeaderShort')}</span>
                  </span>
                  <span className="text-sm font-semibold text-primary-700 shrink-0">{t(`projects.rep.enter.${c.level}`)} →</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Команда */}
      {unit && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-white px-1">{t('projects.rep.team')}</h3>
          {data.members.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-neutral-600 shadow-md">{t('projects.rep.noTeam')}</p>}
          <ul className="space-y-2">
            {data.members.map((m) => (
              <li key={m.id} className="rounded-2xl bg-white p-3 shadow-md flex items-center gap-3">
                <Avatar p={m.person} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-neutral-900 truncate">{m.person?.name}</p>
                  <p className="text-xs text-neutral-500">{[t(`projects.rep.roles.${m.role}`), m.specialization, t(`projects.rep.modes.${m.mode}`)].filter(Boolean).join(' · ')}</p>
                </div>
                {m.person && <Link href={`/profile/${m.person.id}`} className={`${btn} bg-neutral-100 text-neutral-800`}>{t('projects.rep.profileShort')}</Link>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Заявки: маршрут визначає сервер (керівник одиниці або загальна черга) */}
      <section className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {unit && (
            <>
              <button type="button" aria-pressed={form === 'lawyer'} onClick={() => setForm(form === 'lawyer' ? null : 'lawyer')} className={`${btn} ${form === 'lawyer' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-900'}`}>{t('projects.rep.actions.lawyer')}</button>
              <button type="button" aria-pressed={form === 'join'} onClick={() => setForm(form === 'join' ? null : 'join')} className={`${btn} ${form === 'join' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-900'}`}>{t('projects.rep.actions.join')}</button>
              <button type="button" aria-pressed={form === 'consult'} onClick={() => setForm(form === 'consult' ? null : 'consult')} className={`${btn} ${form === 'consult' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-900'}`}>{t('projects.rep.actions.consult')}</button>
            </>
          )}
          {(!unit || data.nextLevel || !leader) && (
            <button type="button" aria-pressed={form === 'open'} onClick={() => setForm(form === 'open' ? null : 'open')} className={`${btn} ${form === 'open' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-900'}`}>
              {!unit ? t('projects.rep.actions.addCountry') : !leader ? t('projects.rep.actions.openHere') : t('projects.rep.actions.openChild', { level: t(`projects.rep.levelsAcc.${data.nextLevel}`) })}
            </button>
          )}
        </div>
        {form && (
          <RepApplyForm key={`${unitId}-${form}`} project={project} kind={form} unitId={unit?.id} leader={leader}
            askPlace={form === 'open' && (!unit || !!data.nextLevel && !!leader)} onDone={() => undefined} />
        )}
      </section>
    </div>
  );
}
