"use client";

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const CreateRequestModal = dynamic(() => import('@/components/requests/CreateRequestModal'), { ssr: false });

export default function CreateRequestPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <CreateRequestModal open={true} onClose={() => router.push('/services')} />
    </div>
  );
}
