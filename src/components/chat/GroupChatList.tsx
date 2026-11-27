'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Users } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';
import { SwipeRow } from '@/components/chat/SwipeRow';
import { askConfirm } from '@/components/ui/ConfirmHost';
import { useToast } from '@/components/ui/Toast';
import { localizedPath } from '@/i18n/routes';

interface Chat { id: number; title: string; members: number; unread: number; isOwner?: boolean; last: { content: string } | null }

/** Список групових чатів прямо у вкладці «Групи» месенджера. */
export function GroupChatList({ onCreate, reloadKey = 0 }: { onCreate: () => void; reloadKey?: number }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    setState('loading');
    fetch('/api/group-chats', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setChats(d.chats); setState('ready'); })
      .catch(() => setState('error'));
  }, [reloadKey]);

  // Власник видаляє групу для всіх, учасник — виходить із неї
  const remove = async (c: Chat) => {
    if (!(await askConfirm(t(c.isOwner ? 'cabinet.groupChats.deleteConfirm' : 'cabinet.groupChats.leaveConfirm')))) return;
    try {
      const res = c.isOwner
        ? await fetch(`/api/group-chats/${c.id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() })
        : await fetch(`/api/group-chats/${c.id}/members`, { method: 'DELETE', credentials: 'include', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: '{}' });
      if (!res.ok) throw new Error();
      setChats((l) => l.filter((x) => x.id !== c.id));
    } catch { toast.error(t('feed.toast.actionFailed')); }
  };

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
        <SwipeRow key={c.id} className="my-1" onOpen={() => router.push(localizedPath(`/chat/groups/${c.id}`, locale))} onDelete={() => remove(c)} label={t(c.isOwner ? 'cabinet.groupChats.delete' : 'cabinet.groupChats.leave')}>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-neutral-100">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-space-700 text-white"><Users className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-neutral-900">{c.title}</span>
              <span className="block truncate text-sm text-neutral-500">{c.last?.content ?? `${c.members} ${t('cabinet.groupChats.members')}`}</span>
            </span>
            {c.unread > 0 && <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-accent-500 px-1.5 text-xs font-bold text-white">{c.unread}</span>}
          </div>
        </SwipeRow>
      ))}
    </div>
  );
}
