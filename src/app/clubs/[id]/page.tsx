'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MapPin, Trash2, Users } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ReportButton } from '@/components/ui/ReportButton';
import { ClubBoard } from '@/components/clubs/ClubBoard';
import { ClubManage } from '@/components/clubs/ClubManage';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';
import { askConfirm } from '@/components/ui/ConfirmHost';

interface Club { id: number; name: string; description: string; category: string; city: string | null; membersCount: number; joined: boolean; isOwner: boolean; ownerId?: number; membership?: 'active' | 'pending' | null; joinMode?: string; postMode?: string; visibility?: string; canPost?: boolean; canSeeBoard?: boolean }
interface Member { id: number; name: string; avatarUrl: string | null }

export default function ClubPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/clubs/${params.id}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace(`/auth/login?returnUrl=/clubs/${params.id}`); return; }
      if (res.status === 404) { setState('missing'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClub(data.club); setMembers(data.members); setState('ok');
    } catch { setState('error'); }
  };

  useEffect(() => {
    if (!readStoredUser()) { router.replace(`/auth/login?returnUrl=/clubs/${params.id}`); return; }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (state === 'loading') return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>;
  if (state !== 'ok' || !club) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-3">
        <p className="text-neutral-600">{state === 'missing' ? t('clubs.notFound') : t('clubs.loadFailed')}</p>
        <Link href="/clubs" className="text-primary-600 font-semibold hover:underline">{t('clubs.backToList')}</Link>
      </div>
    );
  }

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/clubs/${club.id}/join`, { method: club.joined || club.membership === 'pending' ? 'DELETE' : 'POST', credentials: 'include', headers: jsonHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      if (data.pending) toast.success(t('clubs.requested'));
      await load();
    } catch (e: any) {
      toast.error(e?.message || t('feed.toast.actionFailed'));
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!(await askConfirm(t('clubs.deleteConfirm')))) return;
    try {
      const res = await fetch(`/api/clubs/${club.id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
      router.replace('/clubs');
    } catch { toast.error(t('feed.toast.actionFailed')); }
  };

  return (
    <div className="min-h-screen bg-neutral-100 pb-28 md:pb-10">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-3">
        <Link href="/clubs" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700"><ArrowLeft className="w-4 h-4" />{t('clubs.backToList')}</Link>
        <section className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 break-words">{club.name}</h1>
            <p className="text-sm text-neutral-500 flex flex-wrap items-center gap-x-3 mt-1">
              <span>{t(`clubs.categories.${club.category}`)}</span>
              {club.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{club.city}</span>}
              <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{t('clubs.members', { count: club.membersCount })}</span>
            </p>
          </div>
          <p className="text-neutral-800 whitespace-pre-wrap break-words">{club.description}</p>
          <div className="flex flex-wrap gap-2">
            {!club.isOwner && (
              <button type="button" onClick={toggle} disabled={busy} className={cn('rounded-lg px-5 py-2.5 text-sm font-semibold transition active:scale-95', club.joined || club.membership === 'pending' ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300' : 'bg-primary-500 text-neutral-900 hover:bg-primary-600')}>
                {club.joined ? t('clubs.leave') : club.membership === 'pending' ? t('clubs.cancelRequest') : club.joinMode === 'approval' ? t('clubs.joinRequest') : t('clubs.join')}
              </button>
            )}
            {club.isOwner && <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2.5 text-sm font-semibold"><Trash2 className="w-4 h-4" />{t('clubs.delete')}</button>}
          </div>
        </section>

        {club.isOwner && <ClubManage clubId={club.id} onChanged={load} />}

        {club.canSeeBoard ? (
          <ClubBoard clubId={club.id} canPost={!!club.canPost} canComment={club.joined} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center text-sm text-neutral-600">{t('clubs.closedBoard')}</div>
        )}

        {club.canSeeBoard && <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-neutral-900 mb-3">{t('clubs.membersTitle')}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {members.map((m) => (
              <li key={m.id}><Link href={`/profile/${m.id}`} className="flex items-center gap-2.5 rounded-xl hover:bg-neutral-50 p-1.5">
                <UserAvatar src={m.avatarUrl} alt={m.name} fallbackName={m.name} className="w-10 h-10 rounded-full shrink-0" /><span className="truncate text-sm font-medium">{m.name}</span>
              </Link></li>
            ))}
          </ul>
        </section>}

        {!club.isOwner && club.ownerId && <div className="text-center"><ReportButton reportedUserId={club.ownerId ?? 0} contentType="user" label={t('clubs.report')} /></div>}
      </div>
    </div>
  );
}
