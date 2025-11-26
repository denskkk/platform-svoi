'use client';

import { Suspense } from 'react';
import CreateRequestForm from './CreateRequestForm';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-neutral-600">Завантаження...</div>
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
