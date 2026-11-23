'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { readStoredUser } from '@/lib/feedClient';
import { useEffect, useState } from 'react';

/** «Мій кабінет» проєкту: швидкі переходи до власних заявок, пропозицій, переговорів, оголошень, повідомлень і налаштувань. */
export default function ProjectCabinetPage() {
  const params = useParams<{ slug: string }>();
  const { t } = useI18n();
  const [uid, setUid] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { const u: any = readStoredUser(); setUid(u?.id ? Number(u.id) : null); setReady(true); }, []);
  const base = `/projects/${params.slug}`;
  const tiles: Array<[string, string, string]> = [
    ['profile', '👤', uid ? `/profile/${uid}` : '/profile'],
    ['companies', '🏢', '/my-listings'],
    ['products', '📦', '/my-listings'],
    ['requests', '📝', `${base}?folder=markets.requests.mine`],
    ['offers', '📨', `${base}?folder=markets.talks.send`],
    ['contacts', '📇', '/contacts'],
    ['negotiations', '💬', `${base}?folder=markets.talks.active`],
    ['partners', '🤝', `${base}?folder=markets.reps.mine`],
    ['documents', '📎', `${base}?folder=markets.talks.active`],
    ['saved', '⭐', '/saved'],
    ['messages', '✉️', '/chat'],
    ['notifications', '🔔', '/notifications'],
    ['settings', '⚙️', '/menu/settings'],
  ];
  return (
    <div className="min-h-screen bg-space-800">
      <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <Link href={base} className="inline-flex items-center gap-2 rounded-full bg-black/30 backdrop-blur text-sm font-semibold text-white px-3 py-1.5"><ArrowLeft className="w-4 h-4" /> {t('projects.back')}</Link>
        <h1 className="text-xl font-bold text-white">{t('projects.cabinet.title')}</h1>
        {ready && !uid && <p className="rounded-2xl bg-white p-4 text-sm text-neutral-700">{t('listings.common.loginRequired')}</p>}
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tiles.map(([k, icon, href]) => (
            <li key={k}><Link href={href} className="flex h-full flex-col items-center justify-center gap-1 rounded-2xl bg-white p-4 text-center shadow-md hover:shadow-lg"><span className="text-3xl" aria-hidden>{icon}</span><span className="text-sm font-bold text-neutral-900">{t(`projects.cabinet.${k}`)}</span></Link></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
