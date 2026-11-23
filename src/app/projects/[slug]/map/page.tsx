'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';

interface Place { country: string; region: string; city: string; count: number }

/** «Карта учасників»: місця, які учасники дозволили показувати (поле «Показувати на карті»). Відкриття точки — у картах пристрою / OpenStreetMap. */
export default function ProjectMapPage() {
  const params = useParams<{ slug: string }>();
  const { t } = useI18n();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [country, setCountry] = useState('');
  useEffect(() => {
    fetch(`/api/listings/map?project=${encodeURIComponent(params.slug)}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setPlaces(d.places as Place[]))
      .catch(() => { setFailed(true); setPlaces([]); });
  }, [params.slug]);
  const countries = Array.from(new Set((places || []).map((p) => p.country).filter(Boolean))).sort();
  const shown = (places || []).filter((p) => !country || p.country === country);
  return (
    <div className="min-h-screen bg-space-800">
      <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <Link href={`/projects/${params.slug}`} className="inline-flex items-center gap-2 rounded-full bg-black/30 backdrop-blur text-sm font-semibold text-white px-3 py-1.5"><ArrowLeft className="w-4 h-4" /> {t('projects.back')}</Link>
        <h1 className="text-xl font-bold text-white">{t('projects.map.title')}</h1>
        <p className="rounded-2xl bg-black/30 backdrop-blur text-sm text-white p-3">{t('projects.map.lead')}</p>
        {!places && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>}
        {failed && <p className="rounded-2xl bg-white p-4 text-sm text-red-600">{t('listings.common.loadFailed')}</p>}
        {places && !failed && places.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-neutral-600">{t('projects.map.empty')}</p>}
        {countries.length > 1 && (
          <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label={t('projects.board.country')} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base md:text-sm">
            <option value="">{t('projects.map.allCountries')}</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <ul className="space-y-2">
          {shown.map((p, i) => {
            const label = [p.city, p.region, p.country].filter(Boolean).join(', ');
            return (
              <li key={i} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-md">
                <div className="min-w-0"><p className="font-bold text-neutral-900 break-words">{label}</p><p className="text-xs text-neutral-500">{t('projects.map.count', { count: p.count })}</p></div>
                <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(label)}`} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full bg-neutral-900 text-white text-sm font-bold px-4 py-1.5">{t('projects.map.open')}</a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
