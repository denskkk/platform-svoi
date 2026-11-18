'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Loader2, Plus, Trash2, X } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';

interface Story { id: number; mediaType: 'image' | 'video'; mediaUrl: string; posterUrl: string | null; caption: string | null; createdAt: string; seen: boolean; viewsCount?: number }
interface Group { author: { id: number; name: string; avatarUrl: string | null; isVerified: boolean; isOwn: boolean }; hasUnseen: boolean; stories: Story[] }

const IMAGE_MS = 5000;

/** Стрічка історій над дописами: кружечки авторів, додавання власної (фото або відео) та повноекранний перегляд. */
export function StoriesBar({ me }: { me: { firstName?: string; lastName?: string; avatarUrl?: string | null } | null }) {
  const { t } = useI18n();
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [viewer, setViewer] = useState<{ g: number; s: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/stories', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.ok) setGroups((await res.json()).groups || []);
    } catch { /* стрічка без історій */ }
  }, []);
  useEffect(() => { load(); }, [load]);
  // Кнопка «+» у нижньому меню → додати історію (вибір файлу в тому ж жесті користувача)
  useEffect(() => {
    const onPick = () => fileRef.current?.click();
    window.addEventListener('svoi:story-pick', onPick);
    return () => window.removeEventListener('svoi:story-pick', onPick);
  }, []);

  const create = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/stories', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error);
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.type.startsWith('video/')) {
        if (file.size > 50 * 1024 * 1024) throw new Error(t('feed.composer.videoTooLarge'));
        setBusy(t('feed.stories.processing'));
        const up = await fetch('/api/videos/upload', { method: 'POST', credentials: 'include', headers: { ...authHeaders(), 'Content-Type': file.type }, body: file });
        const upData = await up.json().catch(() => ({}));
        if (!up.ok || !upData.video?.id) throw new Error(upData.error);
        const id = upData.video.id as number;
        for (let i = 0; i < 100; i++) { // до ~5 хвилин
          await new Promise((r) => setTimeout(r, 3000));
          const st = await fetch(`/api/videos/${id}`, { credentials: 'include', headers: authHeaders() });
          const d = await st.json().catch(() => ({}));
          if (d.video?.status === 'ready') { await create({ videoId: id }); break; }
          if (d.video?.status === 'failed' || !st.ok) throw new Error(t('feed.composer.videoFailed'));
          if (i === 99) throw new Error(t('feed.composer.videoFailed'));
        }
      } else {
        setBusy(t('feed.stories.uploading'));
        const form = new FormData();
        form.append('file', file);
        form.append('type', 'posts');
        const up = await fetch('/api/upload', { method: 'POST', credentials: 'include', headers: authHeaders(), body: form });
        const upData = await up.json().catch(() => ({}));
        if (!up.ok || !upData.url) throw new Error(upData.error);
        await create({ imageUrl: upData.url });
      }
      toast.success(t('feed.stories.added'));
      await load();
    } catch (e: any) {
      toast.error(e?.message || t('feed.composer.uploadFailed'));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const own = groups.find((g) => g.author.isOwn);
  const others = groups.filter((g) => !g.author.isOwn);
  const name = `${me?.firstName ?? ''} ${me?.lastName ?? ''}`.trim();
  const open = (g: Group) => {
    const gi = groups.indexOf(g);
    const firstUnseen = g.stories.findIndex((s) => !s.seen);
    setViewer({ g: gi, s: firstUnseen >= 0 ? firstUnseen : 0 });
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime,video/webm" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <div className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.12)] p-3 flex gap-3 overflow-x-auto" aria-label={t('feed.stories.title')}>
        <div className="shrink-0 w-[72px] text-center">
          <div className="relative mx-auto w-16 h-16">
            <button type="button" onClick={() => (own ? open(own) : fileRef.current?.click())} disabled={!!busy} aria-label={own ? t('feed.stories.mine') : t('feed.stories.add')}
              className={`w-16 h-16 rounded-full p-[2px] ${own ? 'bg-gradient-to-tr from-primary-500 to-accent-500' : 'bg-neutral-200'}`}>
              <UserAvatar src={me?.avatarUrl} alt={name} fallbackName={name || '?'} className="w-full h-full rounded-full border-2 border-white" />
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={!!busy} aria-label={t('feed.stories.add')}
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary-500 text-white border-2 border-white flex items-center justify-center">
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-neutral-600 truncate">{busy || t('feed.stories.you')}</p>
        </div>
        {others.map((g) => (
          <button key={g.author.id} type="button" onClick={() => open(g)} className="shrink-0 w-[72px] text-center">
            <span className={`block mx-auto w-16 h-16 rounded-full p-[2px] ${g.hasUnseen ? 'bg-gradient-to-tr from-primary-500 to-accent-500' : 'bg-neutral-300'}`}>
              <UserAvatar src={g.author.avatarUrl} alt={g.author.name} fallbackName={g.author.name} className="w-full h-full rounded-full border-2 border-white" />
            </span>
            <span className="mt-1 block text-[11px] text-neutral-700 truncate">{g.author.name}</span>
          </button>
        ))}
      </div>
      {viewer && <StoryViewer groups={groups} start={viewer} onClose={() => { setViewer(null); load(); }} onDeleted={load} />}
    </>
  );
}

function StoryViewer({ groups, start, onClose, onDeleted }: { groups: Group[]; start: { g: number; s: number }; onClose: () => void; onDeleted: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [pos, setPos] = useState(start);
  const [local, setLocal] = useState(groups);
  const [progress, setProgress] = useState(0);
  const group = local[pos.g];
  const story = group?.stories[pos.s];

  const next = useCallback(() => {
    setProgress(0);
    setPos((p) => {
      const g = local[p.g];
      if (p.s + 1 < g.stories.length) return { g: p.g, s: p.s + 1 };
      if (p.g + 1 < local.length) return { g: p.g + 1, s: 0 };
      setTimeout(onClose, 0);
      return p;
    });
  }, [local, onClose]);
  const prev = () => {
    setProgress(0);
    setPos((p) => (p.s > 0 ? { g: p.g, s: p.s - 1 } : p.g > 0 ? { g: p.g - 1, s: 0 } : p));
  };

  // відмітка перегляду
  useEffect(() => {
    if (!story || group.author.isOwn) return;
    fetch(`/api/stories/${story.id}/view`, { method: 'POST', credentials: 'include', headers: authHeaders() }).catch(() => undefined);
  }, [story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // таймер для фото
  useEffect(() => {
    if (!story || story.mediaType !== 'image') return;
    const started = Date.now();
    const iv = setInterval(() => {
      const p = (Date.now() - started) / IMAGE_MS;
      if (p >= 1) { clearInterval(iv); next(); } else setProgress(p);
    }, 100);
    return () => clearInterval(iv);
  }, [story?.id, story?.mediaType, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, onClose]);

  const remove = async () => {
    if (!story) return;
    try {
      const res = await fetch(`/api/stories/${story.id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
      toast.success(t('feed.stories.deleted'));
      onDeleted();
      onClose();
    } catch {
      toast.error(t('feed.stories.deleteFailed'));
    }
  };

  if (!group || !story) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md h-full md:h-[92vh] bg-black">
        <div className="absolute top-0 inset-x-0 z-10 p-3 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex gap-1">
            {group.stories.map((s, i) => (
              <span key={s.id} className="h-0.5 flex-1 rounded bg-white/30 overflow-hidden">
                <span className="block h-full bg-white" style={{ width: i < pos.s ? '100%' : i === pos.s ? `${Math.round(progress * 100)}%` : '0%' }} />
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-white">
            <UserAvatar src={group.author.avatarUrl} alt={group.author.name} fallbackName={group.author.name} className="w-8 h-8 rounded-full" />
            <span className="font-semibold text-sm truncate flex-1">{group.author.name}</span>
            {group.author.isOwn && (
              <>
                <span className="inline-flex items-center gap-1 text-xs"><Eye className="w-4 h-4" />{story.viewsCount ?? 0}</span>
                <button type="button" onClick={remove} aria-label={t('feed.stories.delete')} className="p-2 rounded-full hover:bg-white/20"><Trash2 className="w-5 h-5" /></button>
              </>
            )}
            <button type="button" onClick={onClose} aria-label={t('feed.stories.close')} className="p-2 rounded-full hover:bg-white/20"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {story.mediaType === 'video' ? (
          <video key={story.id} src={story.mediaUrl} poster={story.posterUrl || undefined} autoPlay playsInline
            onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) setProgress(v.currentTime / v.duration); }}
            onEnded={next} className="w-full h-full object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={story.id} src={story.mediaUrl} alt="" className="w-full h-full object-contain" />
        )}
        {story.caption && <p className="absolute bottom-0 inset-x-0 p-4 pb-8 text-white text-sm bg-gradient-to-t from-black/70 to-transparent">{story.caption}</p>}

        <button type="button" onClick={prev} aria-label={t('feed.stories.prev')} className="absolute left-0 top-16 bottom-16 w-1/3 flex items-center justify-start pl-2 text-white/0 hover:text-white/80">
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button type="button" onClick={next} aria-label={t('feed.stories.next')} className="absolute right-0 top-16 bottom-16 w-1/3 flex items-center justify-end pr-2 text-white/0 hover:text-white/80">
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
