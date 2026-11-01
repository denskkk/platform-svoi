'use client';

import { Suspense } from 'react';
import CreateRequestForm from './CreateRequestForm';
import { useI18n } from '@/i18n/client';

function LoadingFallback() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-neutral-600">{t('serviceRequests.common.loading')}</div>
    </div>
  );
}

export default function CreateRequestPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CreateRequestForm />
    </Suspense>
  );
}
