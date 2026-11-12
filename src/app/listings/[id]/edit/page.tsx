'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ListingForm, ListingFormInitial } from '@/components/listings/ListingForm';
import { useI18n } from '@/i18n/client';
import { authHeaders, readStoredUser } from '@/lib/feedClient';

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [listing, setListing] = useState<(ListingFormInitial & { projectSlug: string }) | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const user = readStoredUser();
    if (!user) { router.replace(`/auth/login?returnUrl=/listings/${params.id}/edit`); return; }
    (async () => {
      try {
        const res = await fetch(`/api/listings/${params.id}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.listing?.isOwner) throw new Error();
        setListing(data.listing);
        setState('ready');
      } catch {
        setState('error');
      }
    })();
  }, [params.id, router]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-2xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <Link href="/my-listings" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('listings.common.myListings')}
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">{t('listings.form.titleEdit')}</h1>
        {state === 'loading' && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {state === 'error' && <p className="text-center text-sm text-red-600">{t('listings.common.loadFailed')}</p>}
        {state === 'ready' && listing && <ListingForm slug={listing.projectSlug} initial={listing} />}
      </div>
    </div>
  );
}
