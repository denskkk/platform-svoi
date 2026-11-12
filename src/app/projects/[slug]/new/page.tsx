'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ListingForm } from '@/components/listings/ListingForm';
import { useI18n } from '@/i18n/client';
import { hasListings } from '@/lib/listingFields';
import { readStoredUser } from '@/lib/feedClient';

export default function NewListingPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const user = readStoredUser();
    if (!user) { router.replace(`/auth/login?returnUrl=/projects/${params.slug}/new`); return; }
    if (user.accountType === 'viewer' || !hasListings(params.slug)) { router.replace(`/projects/${params.slug}`); return; }
    setOk(true);
  }, [router, params.slug]);

  if (!ok) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-2xl px-3 sm:px-6 pt-4 pb-28 md:pb-12 space-y-4">
        <Link href={`/projects/${params.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('listings.common.back')}
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">{t('listings.form.titleNew')}</h1>
        <ListingForm slug={params.slug} />
      </div>
    </div>
  );
}
