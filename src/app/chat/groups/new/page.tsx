'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { MenuShell } from '@/components/cabinet/MenuShell';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';

interface Person { id: number; name: string; avatarUrl: string | null }
const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

export default function NewGroupChatPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [picked, setPicked] = useState<Person[]>([]);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Person[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const s = q.trim();
    if (s.length < 2) { setFound([]); return; }
    const h = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?type=people&q=${encodeURIComponent(s)}`, { credentials: 'include', headers: authHeaders() });
        const d = res.ok ? await res.json() : { people: [] };
        setFound((d.people || []).slice(0, 8).map((p: any) => ({ id: p.id, name: p.name, avatarUrl: p.avatarUrl ?? null })));
      } catch { setFound([]); }
    }, 300);
    return () => clearTimeout(h);
  }, [q]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/group-chats', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ title, memberIds: picked.map((p) => p.id) }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error);
      router.push(`/chat/groups/${d.id}`);
    } catch (err: any) {
      toast.error(err?.message || t('cabinet.groupChats.createFailed'));
      setSending(false);
    }
  };

  return (
    <MenuShell title={t('cabinet.groupChats.new')} backHref="/chat/groups">
      <form onSubmit={submit} className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-4 space-y-3">
        <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('cabinet.groupChats.name')}</span>
          <input className={inputCls} required minLength={2} maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <p className="text-sm font-medium text-neutral-700">{t('cabinet.groupChats.add')}</p>
        {picked.length > 0 && <div className="flex flex-wrap gap-2">{picked.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 pl-1 pr-2 py-1 text-sm">
            <UserAvatar src={p.avatarUrl} alt={p.name} fallbackName={p.name} className="w-6 h-6 rounded-full" />{p.name}
            <button type="button" onClick={() => setPicked((a) => a.filter((x) => x.id !== p.id))} aria-label={t('cabinet.groupChats.remove')}><X className="w-3.5 h-3.5" /></button>
          </span>))}</div>}
        <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('cabinet.groupChats.search')} maxLength={80} />
        {found.filter((p) => !picked.some((x) => x.id === p.id)).length > 0 && (
          <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
            {found.filter((p) => !picked.some((x) => x.id === p.id)).map((p) => (
              <li key={p.id}><button type="button" onClick={() => { setPicked((a) => [...a, p]); setQ(''); setFound([]); }} className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-neutral-50 text-left">
                <UserAvatar src={p.avatarUrl} alt={p.name} fallbackName={p.name} className="w-8 h-8 rounded-full" /><span className="truncate text-sm font-medium">{p.name}</span></button></li>))}
          </ul>
        )}
        <button type="submit" disabled={sending} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 text-neutral-900 font-bold py-3 disabled:opacity-50 flex items-center justify-center gap-2">
          {sending && <Loader2 className="w-4 h-4 animate-spin" />}{t('cabinet.groupChats.create')}
        </button>
      </form>
    </MenuShell>
  );
}
