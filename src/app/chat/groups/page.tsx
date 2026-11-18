'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Users } from 'lucide-react';
import { MenuShell } from '@/components/cabinet/MenuShell';
import { useI18n } from '@/i18n/client';
import { authHeaders, readStoredUser } from '@/lib/feedClient';
import { canCreateGroups } from '@/lib/groupRights';

interface Chat { id: number; title: string; members: number; unread: number; last: { content: string } | null }

export default function GroupChatsPage() {
  const { t } = useI18n();
  const [chats, setChats] = useState<Chat[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    fetch('/api/group-chats', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setChats(d.chats); setState('ready'); })
      .catch(() => setState('error'));
  }, []);
  return (
    <MenuShell title={t('cabinet.groupChats.title')} backHref="/chat">
      {canCreateGroups(readStoredUser() ?? {}) && <Link href="/chat/groups/new" className="flex items-center justify-center gap-2 rounded-2xl bg-primary-500 hover:bg-primary-600 text-neutral-900 font-bold py-3 shadow-md"><Plus className="w-5 h-5" />{t('cabinet.groupChats.new')}</Link>}
      {state === 'loading' && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
      {state === 'error' && <p className="text-center text-sm text-red-600">{t('cabinet.groupChats.loadFailed')}</p>}
      {state === 'ready' && chats.length === 0 && <div className="rounded-2xl bg-white border border-neutral-200 p-8 text-center text-sm text-neutral-600">{t('cabinet.groupChats.empty')}</div>}
      {chats.map((c) => (
        <Link key={c.id} href={`/chat/groups/${c.id}`} className="flex items-center gap-3 rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-4">
          <span className="w-11 h-11 rounded-full bg-space-700 text-white flex items-center justify-center shrink-0"><Users className="w-5 h-5" /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold truncate">{c.title}</span>
            <span className="block text-xs text-neutral-500 truncate">{c.last?.content ?? `${c.members} ${t('cabinet.groupChats.members')}`}</span>
          </span>
          {c.unread > 0 && <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-accent-500 text-white text-xs font-bold flex items-center justify-center">{c.unread}</span>}
        </Link>
      ))}
    </MenuShell>
  );
}
