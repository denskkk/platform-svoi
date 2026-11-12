'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Eye, Heart, Loader2, MapPin, MessageCircle, Phone, Share2 } from 'lucide-react';
import { ReportButton } from '@/components/ui/ReportButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, readStoredUser } from '@/lib/feedClient';
import { detailRows, formatPrice } from '@/components/listings/helpers';

interface Listing {
  id: number;
  projectSlug: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  city: string | null;
  createdAt: string;
  expiresAt: string | null;
  status: string;
  isOwner: boolean;
  saved: boolean;
  viewsCount: number;
  contactName: string | null;
  phone: string | null;
  rejectReason: string | null;
  data: Record<string, string | number>;
  images: { id: number; url: string }[];
  owner: { id: number; name: string; avatarUrl: string | null; isVerified: boolean };
}

export default function ListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale, formatDate } = useI18n();
  const toast = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState<ReturnType<typeof readStoredUser>>(null);

  useEffect(() => {
    const user = readStoredUser();
    if (!user) { router.replace(`/auth/login?returnUrl=/listings/${params.id}`); return; }
    setViewer(user);
    (async () => {
      try {
        const res = await fetch(`/api/listings/${params.id}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        if (res.status === 404) { setState('missing'); return; }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error();
        setListing(data.listing);
        setState('ready');
      } catch {
        setState('error');
      }
    })();
  }, [params.id, router]);

  const toggleSave = async () => {
    if (!listing) return;
    const next = !listing.saved;
    setListing({ ...listing, saved: next });
    try {
      const res = await fetch(`/api/listings/${listing.id}/save`, { method: next ? 'POST' : 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
    } catch {
      setListing((l) => (l ? { ...l, saved: !next } : l));
      toast.error(t('feed.toast.actionFailed'));
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: listing?.title, url }); return; }
      await navigator.clipboard.writeText(url);
      toast.success(t('listings.common.linkCopied'));
    } catch { /* користувач скасував */ }
  };

  const canSave = viewer?.accountType !== undefined;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('listings.common.back')}
        </button>

        {state === 'loading' && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {state === 'missing' && <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center text-neutral-600">{t('api.listings.notFound')}</div>}
        {state === 'error' && <div className="bg-white rounded-2xl border border-red-100 p-6 text-center text-sm text-red-600">{t('listings.common.loadFailed')}</div>}

        {state === 'ready' && listing && (
          <article className="bg-white rounded-3xl border border-neutral-200/70 shadow-sm overflow-hidden">
            {listing.isOwner && listing.status !== 'approved' && (
              <div className={cn('px-4 py-3 text-sm', listing.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary-900')}>
                <p className="font-semibold">{t(`listings.status.${listing.status}`)}</p>
                {listing.rejectReason && <p className="mt-0.5">{t('listings.mine.reason')}: {listing.rejectReason}</p>}
              </div>
            )}

            {/* Галерея */}
            {listing.images.length > 0 && (
              <div>
                <div className="bg-neutral-100 flex items-center justify-center max-h-[28rem] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={listing.images[active]?.url} alt="" className="w-full max-h-[28rem] object-contain" />
                </div>
                {listing.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-3">
                    {listing.images.map((img, i) => (
                      <button key={img.id} type="button" onClick={() => setActive(i)} className={cn('h-16 w-20 shrink-0 rounded-lg overflow-hidden border-2', i === active ? 'border-primary-500' : 'border-transparent')}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="p-4 sm:p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-neutral-900">{formatPrice(listing.price, listing.currency, locale, t)}</p>
                  <h1 className="text-lg text-neutral-800 mt-1 break-words">{listing.title}</h1>
                  <p className="text-sm text-neutral-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {listing.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{listing.city}</span>}
                    <span>{t('listings.common.published')}: {formatDate(listing.createdAt)}</span>
                    <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{listing.viewsCount}</span>
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {canSave && (
                    <button type="button" onClick={toggleSave} aria-pressed={listing.saved} aria-label={listing.saved ? t('listings.common.unsave') : t('listings.common.save')} className="h-10 w-10 rounded-full border border-neutral-200 flex items-center justify-center">
                      <Heart className={cn('w-5 h-5', listing.saved ? 'fill-red-500 text-red-500' : 'text-neutral-600')} />
                    </button>
                  )}
                  <button type="button" onClick={share} aria-label={t('listings.common.share')} className="h-10 w-10 rounded-full border border-neutral-200 flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-neutral-600" />
                  </button>
                </div>
              </div>

              {detailRows(listing.projectSlug, listing.data, t).length > 0 && (
                <section>
                  <h2 className="font-semibold text-neutral-900 mb-2">{t('listings.common.details')}</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    {detailRows(listing.projectSlug, listing.data, t).map((r) => (
                      <div key={r.label} className="flex justify-between gap-3 border-b border-neutral-100 py-1.5">
                        <dt className="text-neutral-500">{r.label}</dt>
                        <dd className="font-medium text-neutral-900 text-right">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              <section>
                <h2 className="font-semibold text-neutral-900 mb-2">{t('listings.common.description')}</h2>
                <p className="text-[15px] leading-relaxed text-neutral-800 whitespace-pre-wrap break-words">{listing.description}</p>
              </section>

              <section className="rounded-2xl bg-neutral-50 p-4 space-y-3">
                <Link href={`/profile/${listing.owner.id}`} className="flex items-center gap-3">
                  <UserAvatar src={listing.owner.avatarUrl} alt={listing.owner.name} fallbackName={listing.owner.name} className="w-12 h-12 rounded-full" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-semibold text-neutral-900"><span className="truncate">{listing.owner.name}</span>{listing.owner.isVerified && <BadgeCheck className="w-4 h-4 text-accent-500" />}</span>
                    {listing.contactName && <span className="block text-xs text-neutral-500">{t('listings.common.contactPerson')}: {listing.contactName}</span>}
                  </span>
                </Link>
                {!listing.isOwner && (
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/chat?with=${listing.owner.id}`} className="inline-flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5">
                      <MessageCircle className="w-5 h-5" /> {t('listings.common.writeMessage')}
                    </Link>
                    {listing.phone && (
                      <a href={`tel:${listing.phone.replace(/[^+0-9]/g, '')}`} className="inline-flex items-center gap-2 rounded-full bg-white border border-neutral-200 font-semibold px-5 py-2.5">
                        <Phone className="w-5 h-5" /> {listing.phone}
                      </a>
                    )}
                  </div>
                )}
              </section>

              <div className="flex flex-wrap items-center justify-between gap-3">
                {listing.isOwner ? (
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/listings/${listing.id}/edit`} className="rounded-full bg-neutral-100 hover:bg-neutral-200 font-semibold px-5 py-2 text-sm">{t('listings.mine.edit')}</Link>
                    <Link href="/my-listings" className="rounded-full bg-neutral-100 hover:bg-neutral-200 font-semibold px-5 py-2 text-sm">{t('listings.common.myListings')}</Link>
                  </div>
                ) : (
                  <ReportButton reportedUserId={listing.owner.id} contentType="listing" contentId={listing.id} label={t('listings.common.report')} />
                )}
                {listing.expiresAt && listing.status === 'approved' && <span className="text-xs text-neutral-400">{t('listings.common.validUntil')}: {formatDate(listing.expiresAt)}</span>}
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
