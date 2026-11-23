'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders } from '@/lib/feedClient';
import { ListingCardData, formatPrice, specSummary } from './helpers';

interface Props {
  listing: ListingCardData;
  canSave: boolean;
  onSavedChange?: (id: number, saved: boolean) => void;
}

function ListingCardImpl({ listing, canSave, onSavedChange }: Props) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const specs = specSummary(listing.projectSlug, listing.data, t);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !listing.saved;
    onSavedChange?.(listing.id, next);
    try {
      const res = await fetch(`/api/listings/${listing.id}/save`, { method: next ? 'POST' : 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
    } catch {
      onSavedChange?.(listing.id, !next);
      toast.error(t('feed.toast.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link href={`/listings/${listing.id}`} className="group block rounded-2xl bg-white border border-neutral-200/70 shadow-sm overflow-hidden hover:shadow-md transition">
      <div className="relative aspect-[4/3] bg-neutral-100">
        {listing.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.thumb} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-4xl text-neutral-300" aria-hidden>📷</div>
        )}
        {canSave && (
          <button type="button" onClick={toggleSave} aria-pressed={listing.saved} aria-label={listing.saved ? t('listings.common.unsave') : t('listings.common.save')}
            className="absolute top-2 right-2 h-9 w-9 rounded-full bg-white/90 shadow flex items-center justify-center active:scale-95">
            <Heart className={cn('w-5 h-5', listing.saved ? 'fill-red-500 text-red-500' : 'text-neutral-600')} />
          </button>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="font-bold text-neutral-900">{formatPrice(listing.price, listing.currency, locale, t)}</p>
        <p className="text-sm text-neutral-800 line-clamp-2 leading-snug">{listing.title}</p>
        {specs.length > 0 && <p className="text-xs text-neutral-500 truncate">{specs.join(' · ')}</p>}
        {listing.city && (
          <p className="text-xs text-neutral-500 inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.city}</p>
        )}
      </div>
    </Link>
  );
}

export const ListingCard = memo(ListingCardImpl);
