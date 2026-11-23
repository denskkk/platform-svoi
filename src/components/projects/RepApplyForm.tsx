'use client';

import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { jsonHeaders } from '@/lib/feedClient';
import { REP_MODES, RepKind, RepPerson } from '@/lib/rep';

const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

interface Props {
  project: string;
  kind: RepKind;
  unitId?: number | null;
  /** Керівник обраної одиниці (для підказки, куди піде заявка); null — керівника немає */
  leader?: RepPerson | null;
  /** Попросити назву місця (нова країна / область / район тощо) */
  askPlace?: boolean;
  placeValue?: string;
  onDone?: () => void;
}

/** Заявка до представництва. Сервер сам вирішує маршрут: керівник одиниці або загальна черга. */
export function RepApplyForm({ project, kind, unitId, leader, askPlace, placeValue, onDone }: Props) {
  const { t } = useI18n();
  const toast = useToast();
  const [place, setPlace] = useState(placeValue ?? '');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [mode, setMode] = useState<string>('both');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ routedTo: 'leader' | 'general'; leader: RepPerson | null } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!/^\+?[0-9 ()-]{7,30}$/.test(phone.trim())) { toast.error(t('projects.china.phoneInvalid')); return; }
    setSending(true);
    try {
      const res = await fetch('/api/rep/applications', {
        method: 'POST', credentials: 'include', headers: jsonHeaders(),
        body: JSON.stringify({ project, kind, unitId: unitId || undefined, placeName: (askPlace ? place : placeValue) || undefined, message, phone, specialization: kind === 'lawyer' ? specialization : undefined, mode: kind === 'lawyer' ? mode : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(res.status === 409 ? t('projects.rep.duplicate') : t('feed.toast.actionFailed')); return; }
      setDone({ routedTo: data.routedTo, leader: data.leader || null });
      onDone?.();
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-5 text-center space-y-1 shadow-md">
        <div className="text-3xl" aria-hidden>✅</div>
        <p className="font-bold text-neutral-900">{t('projects.rep.sent')}</p>
        <p className="text-sm text-neutral-600">{done.routedTo === 'leader' && done.leader ? t('projects.rep.sentToLeader', { name: done.leader.name }) : t('projects.rep.sentGeneral')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 space-y-3 shadow-md">
      <p className="text-sm font-semibold text-neutral-900">{t(`projects.rep.kinds.${kind}`)}</p>
      <p className="text-xs text-neutral-600">{leader ? t('projects.rep.willGoToLeader', { name: leader.name }) : t('projects.rep.willGoGeneral')}</p>
      {askPlace && <input required={!unitId} value={place} onChange={(e) => setPlace(e.target.value)} maxLength={120} placeholder={t('projects.rep.placeName')} aria-label={t('projects.rep.placeName')} className={inputCls} />}
      {kind === 'lawyer' && (
        <>
          <input required value={specialization} onChange={(e) => setSpecialization(e.target.value)} maxLength={160} placeholder={t('projects.rep.specialization')} aria-label={t('projects.rep.specialization')} className={inputCls} />
          <select value={mode} onChange={(e) => setMode(e.target.value)} aria-label={t('projects.rep.mode')} className={inputCls}>
            {REP_MODES.map((m) => <option key={m} value={m}>{t(`projects.rep.modes.${m}`)}</option>)}
          </select>
        </>
      )}
      <textarea required minLength={5} maxLength={800} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t(`projects.rep.hint.${kind}`)} className={inputCls} />
      <input type="tel" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder={t('projects.china.phone')} aria-label={t('projects.china.phone')} className={inputCls} />
      {kind === 'lawyer' && <p className="text-xs text-neutral-500">{t('projects.rep.verifyNote')}</p>}
      <button type="submit" disabled={sending} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 font-bold py-2.5 disabled:opacity-50 inline-flex items-center justify-center gap-2">
        {sending && <Loader2 className="w-4 h-4 animate-spin" />}{t('cabinet.suggest.send')}
      </button>
    </form>
  );
}
