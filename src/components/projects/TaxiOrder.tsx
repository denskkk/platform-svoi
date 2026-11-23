'use client';

import { FormEvent, useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { jsonHeaders } from '@/lib/feedClient';

const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

/** Замовлення таксі: звідки/куди (адреса або геолокація), карта OpenStreetMap, вибір водія. Якщо в місті ще не працює — підписка на запуск. */
export interface TaxiOrderProps {
  /** Який блок форми виділено: за папкою «Замовити таксі» */
  variant?: 'now' | 'scheduled' | 'address' | 'class' | 'wishes';
  /** Трансфер / спецперевезення (папка «Трансфери») */
  ride?: 'airport' | 'station' | 'intercity' | 'international' | 'group' | 'special';
}

export function TaxiOrder({ variant = 'now', ride }: TaxiOrderProps = {}) {
  const { t } = useI18n();
  const toast = useToast();
  const [city, setCity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pref, setPref] = useState('any');
  const [when, setWhen] = useState('');
  const [carClass, setCarClass] = useState(ride === 'group' ? 'minivan' : 'economy');
  const [wishes, setWishes] = useState('');
  const [passengers, setPassengers] = useState('1');
  const showWhen = variant === 'scheduled' || !!ride;
  const showClass = variant === 'class' || !!ride;
  const showWishes = variant === 'wishes' || ride === 'special' || ride === 'group';
  const showPassengers = ride === 'group';
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<'waitlist' | 'order' | null>(null);

  const locate = () => {
    if (!navigator.geolocation) { toast.error(t('cabinet.taxi.noGeo')); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setFrom((f) => f || t('cabinet.taxi.myLocation')); setLocating(false); },
      () => { setLocating(false); toast.error(t('cabinet.taxi.noGeo')); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/taxi/requests', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({
        kind: 'order', city, fromAddress: from, toAddress: to, lat: pos?.lat, lng: pos?.lng, driverPref: pref,
        rideType: ride, carClass: showClass ? carClass : undefined, wishes: showWishes ? wishes : undefined,
        passengers: showPassengers ? Number(passengers) || 1 : undefined,
        scheduledAt: showWhen && when ? new Date(when).toISOString() : undefined,
      }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      setResult(data.kind === 'order' ? 'order' : 'waitlist');
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  const mapSrc = pos ? `https://www.openstreetmap.org/export/embed.html?bbox=${pos.lng - 0.01}%2C${pos.lat - 0.006}%2C${pos.lng + 0.01}%2C${pos.lat + 0.006}&layer=mapnik&marker=${pos.lat}%2C${pos.lng}` : null;

  if (result) {
    return (
      <div className="rounded-2xl bg-white p-5 space-y-2 shadow-md text-center">
        <div className="text-4xl" aria-hidden>🚕</div>
        <h2 className="font-bold text-lg text-neutral-900">{t(result === 'order' ? 'cabinet.taxi.sent' : 'cabinet.taxi.notYet', { city })}</h2>
        <p className="text-sm text-neutral-600">{t(result === 'order' ? 'cabinet.taxi.sentHint' : 'cabinet.taxi.notYetHint')}</p>
        <button type="button" onClick={() => setResult(null)} className="rounded-full bg-primary-500 font-bold px-6 py-2.5">{t('cabinet.taxi.again')}</button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 space-y-3 shadow-md">
      <input required value={city} onChange={(e) => setCity(e.target.value)} maxLength={120} placeholder={t('cabinet.taxi.city')} className={inputCls} />
      <div className="flex gap-2">
        <input value={from} onChange={(e) => setFrom(e.target.value)} maxLength={255} placeholder={t('cabinet.taxi.from')} className={inputCls} />
        <button type="button" onClick={locate} disabled={locating} aria-label={t('cabinet.taxi.useLocation')} className="shrink-0 rounded-xl bg-space-700 text-white px-3 disabled:opacity-50"><LocateFixed className="w-5 h-5" /></button>
      </div>
      <input value={to} onChange={(e) => setTo(e.target.value)} maxLength={255} placeholder={t('cabinet.taxi.to')} className={inputCls} />
      {mapSrc ? (
        <iframe title={t('cabinet.projects.taxi.map')} src={mapSrc} className="w-full h-44 rounded-xl border border-neutral-200" loading="lazy" />
      ) : (
        <div className="h-24 rounded-xl bg-neutral-100 flex items-center justify-center gap-2 text-sm text-neutral-500"><MapPin className="w-4 h-4" />{t('cabinet.taxi.mapHint')}</div>
      )}
      {showWhen && (
        <label className="block text-sm font-semibold text-neutral-700">{t('projects.taxi.order.scheduledAt')}
          <input type="datetime-local" required={variant === 'scheduled'} value={when} onChange={(e) => setWhen(e.target.value)} className={`${inputCls} mt-1 font-normal`} />
        </label>
      )}
      {showClass && (
        <label className="block text-sm font-semibold text-neutral-700">{t('projects.taxi.order.class')}
          <select value={carClass} onChange={(e) => setCarClass(e.target.value)} className={`${inputCls} mt-1 font-normal`}>
            {['economy', 'comfort', 'business', 'minivan'].map((k) => <option key={k} value={k}>{t(`projects.taxi.order.classes.${k}`)}</option>)}
          </select>
        </label>
      )}
      {showPassengers && (
        <label className="block text-sm font-semibold text-neutral-700">{t('projects.taxi.order.passengers')}
          <input type="number" inputMode="numeric" min={1} max={50} value={passengers} onChange={(e) => setPassengers(e.target.value)} className={`${inputCls} mt-1 font-normal`} />
        </label>
      )}
      {showWishes && (
        <label className="block text-sm font-semibold text-neutral-700">{t('projects.taxi.order.wishes')}
          <textarea rows={3} maxLength={255} value={wishes} onChange={(e) => setWishes(e.target.value)} placeholder={t('projects.taxi.order.wishesHint')} className={`${inputCls} mt-1 font-normal`} />
        </label>
      )}
      <label className="block text-sm font-semibold text-neutral-700">{t('cabinet.taxi.driver')}
        <select value={pref} onChange={(e) => setPref(e.target.value)} className={`${inputCls} mt-1 font-normal`}>
          {['any', 'ukrainian', 'slavic', 'local'].map((k) => <option key={k} value={k}>{t(`cabinet.taxi.pref.${k}`)}</option>)}
        </select>
      </label>
      <button type="submit" disabled={sending} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 font-bold py-3 disabled:opacity-50">{t('cabinet.taxi.submit')}</button>
    </form>
  );
}
