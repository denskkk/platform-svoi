'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Users } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';

interface Chat { id: number; title: string; members: number; unread: number; last: { content: string } | null }

/** Список групових чатів прямо у вкладці «Групи» месенджера. */
export function GroupChatList({ onCreate, reloadKey = 0 }: { onCreate: () => void; reloadKey?: number }) {
  const { t } = useI18n();
  const [chats, setChats] = useState<Chat[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    setState('loading');
    fetch('/api/group-chats', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setChats(d.chats); setState('ready'); })
      .catch(() => setState('error'));
  }, [reloadKey]);

  return (
    <div className="px-2 py-1">
      <button type="button" onClick={onCreate} className="my-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-neutral-100">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-500 text-neutral-900"><Plus className="h-6 w-6" /></span>
        <span className="font-semibold text-neutral-900">{t('cabinet.groupChats.new')}</span>
      </button>
      {state === 'loading' && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-neutral-400" /></div>}
      {state === 'error' && <p className="py-4 text-center text-sm text-red-600">{t('cabinet.groupChats.loadFailed')}</p>}
      {state === 'ready' && chats.length === 0 && <p className="p-6 text-center text-sm text-neutral-500">{t('cabinet.groupChats.empty')}</p>}
      {chats.map((c) => (
        <Link key={c.id} href={`/chat/groups/${c.id}`} className="my-1 flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-neutral-100">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-space-700 text-white"><Users className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-neutral-900">{c.title}</span>
            <span className="block truncate text-sm text-neutral-500">{c.last?.content ?? `${c.members} ${t('cabinet.groupChats.members')}`}</span>
          </span>
          {c.unread > 0 && <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-accent-500 px-1.5 text-xs font-bold text-white">{c.unread}</span>}
        </Link>
      ))}
    </div>
  );
}
