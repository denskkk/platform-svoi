'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { jsonHeaders } from '@/lib/feedClient';

type Kind = 'product' | 'specialist' | 'market' | 'suggestion' | 'complaint';

const TILES: { key: string; icon: string; kind?: Kind; href?: (slug: string) => string; soon?: boolean }[] = [
  { key: 'shop', icon: '🛍️', soon: true },
  { key: 'product', icon: '📦', kind: 'product' },
  { key: 'specialist', icon: '🧑‍🔧', kind: 'specialist' },
  { key: 'earn', icon: '💼', href: (s) => `/projects/${s}/earn` },
  { key: 'market', icon: '🌍', kind: 'market' },
  { key: 'suggestion', icon: '💡', kind: 'suggestion' },
  { key: 'complaint', icon: '⚠️', kind: 'complaint' },
];

/**
 * Стандартні плитки в кожному проєкті (по дві в ряд, іконка + підпис): інтернет-магазин (скоро), запропонувати товар,
 * стати/знайти спеціаліста, як заробити, ринок збуту, пропозиція, скарга. Заявки потрапляють в адмінку «Пропозиції».
 */
export function SuggestBox({ projectSlug }: { projectSlug: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const [kind, setKind] = useState<Kind | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending || !kind) return;
    setSending(true);
    try {
      const res = await fetch('/api/project-suggestions', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ projectSlug, kind, text }) });
      if (!res.ok) throw new Error();
      toast.success(t('cabinet.suggest.sent'));
      setText(''); setKind(null);
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  const tileCls = 'rounded-2xl bg-white shadow-md hover:shadow-lg active:scale-[0.98] transition p-3 min-h-[6.5rem] flex flex-col items-center justify-center gap-2 text-center';
  return (
    <section aria-label={t('cabinet.suggest.button')} className="space-y-3">
      <ul className="grid grid-cols-2 gap-3">
        {TILES.map((tile) => (
          <li key={tile.key}>
            {tile.href ? (
              <Link href={tile.href(projectSlug)} className={`${tileCls} h-full`}>
                <span className="text-4xl" aria-hidden>{tile.icon}</span>
                <span className="text-sm font-bold text-neutral-900 leading-snug">{t(`cabinet.tiles.${tile.key}`)}</span>
              </Link>
            ) : (
              <button type="button" onClick={() => (tile.soon ? toast.info(t('cabinet.tiles.soonToast')) : setKind(tile.kind!))}
                aria-pressed={kind === tile.kind && !tile.soon} className={`${tileCls} w-full h-full ${kind === tile.kind && !tile.soon ? 'ring-2 ring-primary-500' : ''}`}>
                <span className="text-4xl" aria-hidden>{tile.icon}</span>
                <span className="text-sm font-bold text-neutral-900 leading-snug">{t(`cabinet.tiles.${tile.key}`)}</span>
                {tile.soon && <span className="text-[11px] font-semibold text-neutral-500">{t('cabinet.tiles.soon')}</span>}
              </button>
            )}
          </li>
        ))}
      </ul>
      {kind && (
        <form onSubmit={submit} className="rounded-2xl bg-white p-4 space-y-3 shadow-md">
          <h3 className="font-bold text-neutral-900">{t(`cabinet.tiles.${kind}`)}</h3>
          <textarea required minLength={5} maxLength={1000} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t(`cabinet.tiles.hint.${kind}`)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="flex-1 rounded-full bg-primary-500 font-bold py-2.5 disabled:opacity-50">{t('cabinet.suggest.send')}</button>
            <button type="button" onClick={() => setKind(null)} className="rounded-full bg-neutral-100 font-semibold px-5">{t('cabinet.suggest.cancel')}</button>
          </div>
        </form>
      )}
    </section>
  );
}
