'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';
import { RepKind, RepPerson } from '@/lib/rep';
import { RepApplyForm } from './RepApplyForm';

interface Opt { id: number; name: string; level: string; flag: string | null; leader: RepPerson | null }
const OTHER = 'other';
const selCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

/**
 * Заявка без ходіння по дереву: обираємо країну → область → район → громаду (скільки є в списку), далі форма.
 * Якщо в обраній одиниці є керівник — заявка піде йому, ні — у загальну чергу.
 * «Іншої немає в списку» доступно для відкриття представництва й консультації; адвокат і вступ прив'язані до наявної одиниці.
 */
export function RepApplyFlow({ project, kind }: { project: string; kind: RepKind }) {
  const { t } = useI18n();
  // levels[i] = { options, selected: id | 'other' | '' }
  const [levels, setLevels] = useState<{ options: Opt[]; selected: string; level: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [place, setPlace] = useState('');
  const allowOther = kind === 'open' || kind === 'consult';

  const fetchChildren = async (unitId: number | null): Promise<{ children: Opt[]; nextLevel: string | null }> => {
    const res = await fetch(`/api/rep/units?project=${encodeURIComponent(project)}${unitId ? `&unitId=${unitId}` : ''}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error();
    const d = await res.json();
    return { children: d.children, nextLevel: d.nextLevel };
  };

  useEffect(() => {
    let cancelled = false;
    fetchChildren(null)
      .then((r) => { if (!cancelled) setLevels([{ options: r.children, selected: '', level: 'country' }]); })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const choose = async (index: number, value: string) => {
    const base = levels.slice(0, index + 1).map((l, i) => (i === index ? { ...l, selected: value } : l));
    setPlace('');
    if (!value || value === OTHER) { setLevels(base); return; }
    setLevels(base);
    try {
      const r = await fetchChildren(Number(value));
      if (r.nextLevel && r.children.length > 0) setLevels(base.concat([{ options: r.children, selected: '', level: r.nextLevel }]));
    } catch { setFailed(true); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-white/80" /></div>;
  if (failed) return <div className="rounded-2xl bg-white p-5 text-center text-sm text-red-600 shadow-md">{t('listings.common.loadFailed')}</div>;

  // Найглибша реально обрана одиниця
  let unit: Opt | null = null;
  let other = false;
  levels.forEach((l) => {
    if (l.selected === OTHER) other = true;
    else if (l.selected) unit = l.options.find((o) => String(o.id) === l.selected) ?? unit;
  });
  const picked = unit as Opt | null;
  const needUnit = kind === 'lawyer' || kind === 'join';
  const ready = needUnit ? !!picked : (!!picked || other);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-md space-y-3">
        <p className="text-sm text-neutral-700">{t(`projects.rep.flowLead.${kind}`)}</p>
        {levels.map((l, i) => (
          <label key={i} className="block text-sm font-semibold text-neutral-700">{t(`projects.rep.levels.${l.level}`)}
            <select value={l.selected} onChange={(e) => choose(i, e.target.value)} className={`${selCls} mt-1 font-normal`}>
              <option value="">{t(`projects.rep.choose.${l.level}`)}</option>
              {l.options.map((o) => <option key={o.id} value={o.id}>{o.flag ? `${o.flag} ` : ''}{o.name}</option>)}
              {allowOther && <option value={OTHER}>{t('projects.rep.notInList')}</option>}
            </select>
          </label>
        ))}
        {levels.length > 0 && levels[0].options.length === 0 && <p className="text-xs text-neutral-500">{t('projects.rep.emptyChildren')}</p>}
        {needUnit && !picked && <p className="text-xs text-neutral-500">{t('projects.rep.needUnit')}</p>}
      </div>
      {ready && (
        <RepApplyForm key={`${picked?.id ?? 'x'}-${other}-${kind}`} project={project} kind={kind} unitId={picked?.id} leader={picked?.leader ?? null}
          askPlace={other || (kind === 'open' && !picked)} placeValue={place} />
      )}
    </div>
  );
}
