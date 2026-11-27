'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus, Send, Trash2, UserPlus } from 'lucide-react';
import { MenuShell } from '@/components/cabinet/MenuShell';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';
import { cn } from '@/lib/utils';
import { askConfirm } from '@/components/ui/ConfirmHost';

interface Msg { id: number; content: string; createdAt: string; mine: boolean; sender: { id: number; name: string; avatarUrl: string | null } }
interface Member { id: number; name: string; avatarUrl: string | null }
interface Found { id: number; name: string; avatarUrl: string | null }

export default function GroupChatPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const id = Number(useParams().id);
  const [title, setTitle] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Found[]>([]);
  const [addBusy, setAddBusy] = useState<number | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const lastId = useRef(0);

  const load = useCallback(async (initial: boolean) => {
    try {
      const qs = !initial && lastId.current ? `?after=${lastId.current}` : '';
      const res = await fetch(`/api/group-chats/${id}/messages${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error();
      const d = await res.json();
      if (initial) { setTitle(d.group.title); setIsOwner(d.group.isOwner); setMembers(d.members || []); setMsgs(d.messages); setState('ready'); }
      else if (d.messages.length) setMsgs((p) => [...p, ...d.messages.filter((m: Msg) => !p.some((x) => x.id === m.id))]);
      if (d.messages.length) lastId.current = d.messages[d.messages.length - 1].id;
    } catch { if (initial) setState('error'); }
  }, [id]);

  useEffect(() => { load(true); }, [load]);
  // Нові повідомлення — опитування раз на 5 с, лише поки вкладка видима
  useEffect(() => {
    const h = setInterval(() => { if (document.visibilityState === 'visible') load(false); }, 5000);
    return () => clearInterval(h);
  }, [load]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/group-chats/${id}/messages`, { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ content: v }) });
      if (!res.ok) throw new Error();
      setText('');
      await load(false);
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setSending(false); }
  };

  // Пошук людей для додавання (власник може додавати учасників і після створення групи)
  useEffect(() => {
    const v = q.trim();
    if (!adding || v.length < 2) { setFound([]); return; }
    const h = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?type=people&q=${encodeURIComponent(v)}`, { credentials: 'include', headers: authHeaders() });
        const d = res.ok ? await res.json() : { people: [] };
        setFound((d.people || []).slice(0, 8).map((p: any) => ({ id: p.id, name: p.name, avatarUrl: p.avatarUrl ?? null })));
      } catch { setFound([]); }
    }, 300);
    return () => clearTimeout(h);
  }, [q, adding]);

  const addMember = async (p: Found) => {
    if (addBusy) return;
    setAddBusy(p.id);
    try {
      const res = await fetch(`/api/group-chats/${id}/members`, { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ userId: p.id }) });
      if (!res.ok) throw new Error();
      setMembers((m) => (m.some((x) => x.id === p.id) ? m : [...m, p]));
      setQ(''); setFound([]);
      toast.success(t('cabinet.groupChats.added', { name: p.name }));
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setAddBusy(null); }
  };

  const rename = async () => {
    const v = draft.trim();
    setEditing(false);
    if (!v || v === title) return;
    try {
      const res = await fetch(`/api/group-chats/${id}`, { method: 'PATCH', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ title: v }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error);
      setTitle(d.title || v);
    } catch (e: any) { toast.error(e?.message || t('feed.toast.actionFailed')); }
  };

  const deleteGroup = async () => {
    if (!(await askConfirm(t('cabinet.groupChats.deleteConfirm')))) return;
    try {
      const res = await fetch(`/api/group-chats/${id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
      router.push('/chat/groups');
    } catch { toast.error(t('feed.toast.actionFailed')); }
  };

  const leaveOrRemove = async (userId?: number) => {
    try {
      const res = await fetch(`/api/group-chats/${id}/members`, { method: 'DELETE', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(userId ? { userId } : {}) });
      if (!res.ok) throw new Error();
      if (userId) setMembers((m) => m.filter((x) => x.id !== userId)); else router.push('/chat/groups');
    } catch { toast.error(t('feed.toast.actionFailed')); }
  };

  return (
    <MenuShell title={title || t('cabinet.groupChats.title')} backHref="/chat/groups">
      {state === 'loading' && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
      {state === 'error' && <p className="text-center text-sm text-red-600">{t('cabinet.groupChats.loadFailed')}</p>}
      {state === 'ready' && (
        <>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => setShowMembers((v) => !v)} className="font-semibold text-space-600">{members.length} {t('cabinet.groupChats.members')}</button>
            {isOwner && <span className="inline-flex items-center gap-1">
              <button type="button" onClick={() => { setDraft(title); setEditing(true); }} aria-label={t('cabinet.groupChats.rename')} title={t('cabinet.groupChats.rename')} className="rounded-full p-2 hover:bg-neutral-100"><Pencil className="w-4 h-4" /></button>
              <button type="button" onClick={deleteGroup} aria-label={t('cabinet.groupChats.delete')} title={t('cabinet.groupChats.delete')} className="rounded-full p-2 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
            </span>}
            {isOwner && <button type="button" onClick={() => { setAdding((v) => !v); setShowMembers(true); }} className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1.5 font-bold text-neutral-900"><UserPlus className="w-4 h-4" />{t('cabinet.groupChats.addShort')}</button>}
            {!isOwner && <button type="button" onClick={() => leaveOrRemove()} className="text-red-600 font-semibold">{t('cabinet.groupChats.leave')}</button>}
          </div>
          {isOwner && editing && (
            <form onSubmit={(e) => { e.preventDefault(); rename(); }} className="flex gap-2">
              <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} minLength={2} maxLength={100} placeholder={t('cabinet.groupChats.renamePrompt')} aria-label={t('cabinet.groupChats.renamePrompt')} className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              <button type="submit" className="rounded-full bg-primary-500 px-4 font-bold text-neutral-900">OK</button>
            </form>
          )}
          {isOwner && adding && (
            <div className="rounded-2xl bg-white border border-neutral-200 p-3 space-y-2">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder={t('cabinet.groupChats.search')} className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              {q.trim().length >= 2 && found.filter((p) => !members.some((m) => m.id === p.id)).length === 0 && <p className="text-sm text-neutral-500">{t('cabinet.groupChats.nobody')}</p>}
              <ul className="divide-y divide-neutral-100">
                {found.filter((p) => !members.some((m) => m.id === p.id)).map((p) => (
                  <li key={p.id} className="flex items-center gap-2.5 py-2">
                    <UserAvatar src={p.avatarUrl} alt={p.name} fallbackName={p.name} className="w-8 h-8 rounded-full" />
                    <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                    <button type="button" disabled={addBusy === p.id} onClick={() => addMember(p)} className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1 text-xs font-bold text-neutral-900 disabled:opacity-50">{addBusy === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}{t('cabinet.groupChats.addShort')}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showMembers && (
            <ul className="rounded-2xl bg-white border border-neutral-200 divide-y divide-neutral-100">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 px-3 py-2">
                  <UserAvatar src={m.avatarUrl} alt={m.name} fallbackName={m.name} className="w-8 h-8 rounded-full" />
                  <span className="flex-1 truncate text-sm font-medium">{m.name}</span>
                  {isOwner && <button type="button" onClick={() => leaveOrRemove(m.id)} className="text-xs text-red-600 font-semibold">{t('cabinet.groupChats.remove')}</button>}
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-2 min-h-[40vh]">
            {msgs.length === 0 && <p className="text-center text-sm text-neutral-500 py-8">{t('cabinet.groupChats.noMessages')}</p>}
            {msgs.map((m) => (
              <div key={m.id} className={cn('flex gap-2', m.mine && 'justify-end')}>
                {!m.mine && <UserAvatar src={m.sender.avatarUrl} alt={m.sender.name} fallbackName={m.sender.name} className="w-8 h-8 rounded-full shrink-0" />}
                <div className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm break-words', m.mine ? 'bg-primary-500 text-neutral-900' : 'bg-white border border-neutral-200')}>
                  {!m.mine && <p className="text-xs font-semibold text-space-600">{m.sender.name}</p>}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            <div ref={bottom} />
          </div>
          <form onSubmit={send} className="sticky bottom-[calc(4.5rem+var(--safe-area-inset-bottom,0px))] lg:bottom-4 flex gap-2 bg-neutral-50 pt-2">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder={t('cabinet.groupChats.write')} className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            <button type="submit" disabled={sending || !text.trim()} aria-label={t('cabinet.groupChats.send')} className="rounded-full bg-primary-500 w-11 h-11 flex items-center justify-center disabled:opacity-50"><Send className="w-5 h-5" /></button>
          </form>
        </>
      )}
    </MenuShell>
  );
}
