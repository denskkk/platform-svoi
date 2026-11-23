'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/** Посилання-запрошення (QR / месенджер): запам'ятовує код і веде на реєстрацію. */
export default function InvitePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  useEffect(() => {
    const code = String(params.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
    try { if (code) localStorage.setItem('svoi_ref', code); } catch { /* приватний режим */ }
    router.replace(code ? `/auth/register?ref=${code}` : '/auth/register');
  }, [params.code, router]);
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>;
}
