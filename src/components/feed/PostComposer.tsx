'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clapperboard, ImagePlus, Loader2, Play, Plus, Store, X } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { FeedPost, authHeaders, jsonHeaders } from '@/lib/feedClient';
import { uploadVideo, shrinkImage, VIDEO_MAX_BYTES, VIDEO_MAX_MB } from '@/lib/videoClient';

const MAX_IMAGES = 6;
const MAX_VIDEOS = 4;
const MAX_MEDIA = 10; // фото й відео разом, як карусель в Instagram
const MAX_LENGTH = 2000;

/** Один елемент каруселі допису: фото або відео. Порядок у списку = порядок показу. */
type Item = { key: string; type: 'image' | 'video'; status: 'uploading' | 'processing' | 'ready' | 'failed'; url?: string; id?: number; posterUrl?: string | null };
let itemSeq = 0;

interface Props {
  /** Якщо задано — допис іде на дошку спільноти */
  clubId?: number;
  canPost: boolean;
  user: { firstName?: string; lastName?: string; avatarUrl?: string | null } | null;
  onPosted: (post: FeedPost) => void;
}

export function PostComposer({ canPost, user, onPosted, clubId }: Props) {
  const { t } = useI18n();
  const toast = useToast();
  const mediaRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [publishing, setPublishing] = useState(false);
  // Кнопка «+» у нижньому меню: відкрити форму або одразу вибір фото/відео
  useEffect(() => {
    const onCompose = (e: Event) => {
      const kind = (e as CustomEvent<string>).detail;
      setOpen(true);
      if (kind === 'photo' || kind === 'video') mediaRef.current?.click();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('svoi:compose', onCompose);
    const kind = new URLSearchParams(window.location.search).get('create');
    if (kind === 'post') setOpen(true);
    return () => window.removeEventListener('svoi:compose', onCompose);
  }, []);

  const patchItem = (key: string, patch: Partial<Item>) => setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  // Відео обробляється на сервері: опитуємо статус кожного, що ще «processing»
  const processingSig = items.filter((i) => i.type === 'video' && i.status === 'processing' && i.id).map((i) => `${i.key}:${i.id}`).join(',');
  useEffect(() => {
    if (!processingSig) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      await Promise.all(processingSig.split(',').map(async (pair) => {
        const [key, idStr] = pair.split(':');
        try {
          const res = await fetch(`/api/videos/${idStr}`, { credentials: 'include', headers: authHeaders() });
          const data = await res.json().catch(() => ({}));
          if (stop) return;
          if (data.video?.status === 'ready') patchItem(key, { status: 'ready', posterUrl: data.video.posterUrl });
          else if (data.video?.status === 'failed' || !res.ok) patchItem(key, { status: 'failed' });
        } catch { /* спробуємо ще раз */ }
      }));
      if (!stop) timer = setTimeout(tick, 3000);
    };
    timer = setTimeout(tick, 2000);
    return () => { stop = true; clearTimeout(timer); };
  }, [processingSig]);

  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  if (!canPost) {
    return (
      <div className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.12)] p-4 flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">{t('feed.composer.viewerNotice')}</p>
        <Link href="/auth/register" className="shrink-0 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2">
          {t('feed.composer.viewerAction')}
        </Link>
      </div>
    );
  }

  const reset = () => { setText(''); setItems([]); setOpen(false); };

  // Студія створення (камера, галерея, фото/рілс) — та сама, що відкривається кнопкою «+». Якщо її на екрані немає — системний вибір файлу.
  const studioAvailable = () => typeof document !== 'undefined' && !!document.querySelector('[data-creator-host]');
  const openStudio = (mode: 'photo' | 'reel') => {
    window.dispatchEvent(new CustomEvent('svoi:create', { detail: { mode, caption: text.trim() } }));
    reset();
  };

  const removeItem = (key: string) => {
    const it = items.find((i) => i.key === key);
    if (it?.type === 'video' && it.id) fetch(`/api/videos/${it.id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() }).catch(() => undefined);
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const move = (key: string, dir: -1 | 1) => setItems((prev) => {
    const i = prev.findIndex((x) => x.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= prev.length) return prev;
    const next = prev.slice();
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const uploadImage = async (key: string, file: File) => {
    try {
      const form = new FormData();
      form.append('file', await shrinkImage(file));
      form.append('type', 'posts');
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', headers: authHeaders(), body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error);
      patchItem(key, { status: 'ready', url: data.url });
    } catch (e: any) {
      setItems((prev) => prev.filter((i) => i.key !== key));
      toast.error(e?.message || t('feed.composer.uploadFailed'));
    }
  };

  const uploadVideoItem = async (key: string, file: File) => {
    try {
      const id = await uploadVideo(file, t);
      patchItem(key, { status: 'processing', id });
    } catch (e: any) {
      setItems((prev) => prev.filter((i) => i.key !== key));
      toast.error(e?.message || t('feed.composer.videoUploadFailed'));
    }
  };

  // Фото й відео вибираються разом: кожен файл стає плиткою каруселі у порядку вибору
  const pickMedia = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    let room = MAX_MEDIA - items.length;
    let photos = items.filter((i) => i.type === 'image').length;
    let videos = items.filter((i) => i.type === 'video').length;
    const added: Item[] = [];
    const work: Array<() => void> = [];
    let skipped = false;
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|3gp|avi|mkv)$/i.test(file.name);
      if (room <= 0) { skipped = true; continue; }
      if (isVideo) {
        if (videos >= MAX_VIDEOS) { toast.info(t('feed.composer.maxVideos', { max: MAX_VIDEOS })); continue; }
        if (file.size > VIDEO_MAX_BYTES) { toast.error(t('feed.composer.videoTooLarge', { max: VIDEO_MAX_MB })); continue; }
        const key = `m${++itemSeq}`;
        added.push({ key, type: 'video', status: 'uploading' });
        work.push(() => uploadVideoItem(key, file));
        videos++; room--;
      } else {
        if (photos >= MAX_IMAGES) { toast.info(t('feed.composer.maxPhotos', { max: MAX_IMAGES })); continue; }
        const key = `m${++itemSeq}`;
        added.push({ key, type: 'image', status: 'uploading' });
        work.push(() => uploadImage(key, file));
        photos++; room--;
      }
    }
    if (skipped) toast.info(t('feed.composer.maxMedia', { max: MAX_MEDIA }));
    if (mediaRef.current) mediaRef.current.value = '';
    if (added.length === 0) return;
    setItems((prev) => [...prev, ...added]);
    work.forEach((fn) => fn());
  };

  const busy = items.some((i) => i.status === 'uploading' || i.status === 'processing');
  const readyMedia = items.filter((i) => i.status === 'ready');
  const canSubmit = !publishing && !busy && (text.trim().length > 0 || readyMedia.length > 0);

  const publish = async () => {
    if (!canSubmit) return;
    setPublishing(true);
    try {
      const media = readyMedia.map((i) => (i.type === 'video' ? { type: 'video', id: i.id } : { type: 'image', url: i.url }));
      const res = await fetch('/api/posts', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ content: text.trim(), media, clubId }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      onPosted(data.post);
      toast.success(t('feed.toast.posted'));
      reset();
    } catch (e: any) {
      toast.error(e?.message || t('feed.errors.publish'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.12)] p-3 sm:p-4 min-w-0 max-w-full overflow-hidden">
      <input ref={mediaRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => pickMedia(e.target.files)} />
      <div className="flex gap-3">
        <UserAvatar src={user?.avatarUrl} alt={name} fallbackName={name || '?'} className="w-10 h-10 rounded-full shrink-0" />
        {!open ? (
          <button type="button" onClick={() => setOpen(true)} className="flex-1 min-w-0 text-left rounded-full bg-neutral-100 hover:bg-neutral-200 px-4 py-2.5 text-neutral-500 text-[15px] truncate transition-colors">
            {user?.firstName ? t('feed.composer.promptNamed', { name: user.firstName }) : t('feed.composer.prompt')}
          </button>
        ) : (
          <div className="flex-1 min-w-0">
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_LENGTH}
              rows={3}
              placeholder={t('feed.composer.placeholder')}
              className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2 text-base md:text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            {text.length > MAX_LENGTH - 200 && (
              <p className="text-xs text-neutral-500 text-right mt-1">{t('feed.composer.charsLeft', { count: MAX_LENGTH - text.length })}</p>
            )}
          </div>
        )}
      </div>

      {!open && (
        <div className="mt-3 pt-2 border-t border-neutral-200 grid grid-cols-3 gap-1">
          <button type="button" onClick={() => { if (studioAvailable()) { openStudio('photo'); return; } setOpen(true); setTimeout(() => mediaRef.current?.click(), 0); }} className="inline-flex items-center justify-center gap-2 rounded-md py-2 text-[14px] font-semibold text-neutral-600 hover:bg-neutral-100">
            <ImagePlus className="w-5 h-5 text-green-600" /> {t('feed.composer.photo')}
          </button>
          <button type="button" onClick={() => { if (studioAvailable()) { openStudio('reel'); return; } setOpen(true); setTimeout(() => mediaRef.current?.click(), 0); }} className="inline-flex items-center justify-center gap-2 rounded-md py-2 text-[14px] font-semibold text-neutral-600 hover:bg-neutral-100">
            <Clapperboard className="w-5 h-5 text-rose-500" /> {t('feed.composer.addVideo')}
          </button>
          <Link href="/projects" className="inline-flex items-center justify-center gap-2 rounded-md py-2 text-[14px] font-semibold text-neutral-600 hover:bg-neutral-100">
            <Store className="w-5 h-5 text-primary-600" /> {t('feed.composer.listing')}
          </Link>
        </div>
      )}

      {open && (
        <>
          {items.length > 0 && (
            <div className="mt-3">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {items.map((it, i) => (
                  <div key={it.key} className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100">
                    {it.type === 'image' && it.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.url} alt="" className="w-full h-full object-cover" />
                    )}
                    {it.type === 'video' && it.posterUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.posterUrl} alt="" className="w-full h-full object-cover" />
                    )}
                    {it.type === 'video' && !it.posterUrl && <span className="absolute inset-0 flex items-center justify-center bg-neutral-800"><Clapperboard className="w-6 h-6 text-neutral-400" /></span>}
                    {it.type === 'video' && it.status === 'ready' && <span className="absolute bottom-1 left-1 inline-flex items-center rounded-full bg-black/60 p-1 text-white"><Play className="w-3 h-3 fill-white" aria-hidden /></span>}
                    {(it.status === 'uploading' || it.status === 'processing') && (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-white text-[11px] font-medium text-center px-1">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {it.type === 'video' ? (it.status === 'uploading' ? t('feed.composer.videoUploading') : t('feed.composer.mediaProcessing')) : t('feed.composer.uploading')}
                      </span>
                    )}
                    {it.status === 'failed' && <span className="absolute inset-0 flex items-center justify-center bg-red-600/80 text-white text-[11px] font-semibold text-center px-1">{t('feed.composer.videoFailed')}</span>}
                    <span className="absolute top-1 left-1 h-5 min-w-5 px-1 rounded-full bg-black/60 text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                    <button type="button" onClick={() => removeItem(it.key)} aria-label={t('feed.composer.removeMedia')}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {items.length > 1 && it.status !== 'uploading' && (
                      <>
                        {i > 0 && (
                          <button type="button" onClick={() => move(it.key, -1)} aria-label={t('feed.composer.moveEarlier')}
                            className="absolute bottom-1 left-1 h-6 w-6 rounded-full bg-white/90 text-neutral-900 flex items-center justify-center shadow"><ChevronLeft className="w-4 h-4" /></button>
                        )}
                        {i < items.length - 1 && (
                          <button type="button" onClick={() => move(it.key, 1)} aria-label={t('feed.composer.moveLater')}
                            className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-white/90 text-neutral-900 flex items-center justify-center shadow"><ChevronRight className="w-4 h-4" /></button>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {items.length < MAX_MEDIA && (
                  <button type="button" onClick={() => mediaRef.current?.click()} aria-label={t('feed.composer.addMore')}
                    className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 text-neutral-500 hover:bg-neutral-50 flex flex-col items-center justify-center gap-1 text-xs font-medium">
                    <Plus className="w-6 h-6" />{t('feed.composer.addMore')}
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">{t('feed.composer.mediaCount', { count: items.length, max: MAX_MEDIA })}</p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <button type="button" onClick={() => mediaRef.current?.click()} disabled={items.length >= MAX_MEDIA}
                aria-label={t('feed.composer.addMedia')} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-accent-600 hover:bg-accent-50 disabled:opacity-40">
                <ImagePlus className="w-5 h-5" /> <Clapperboard className="w-5 h-5 -ml-1 text-rose-500" /> <span className="hidden sm:inline">{t('feed.composer.addMedia')}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button type="button" onClick={reset} className="rounded-full px-3 sm:px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 whitespace-nowrap">{t('feed.composer.cancel')}</button>
              <button type="button" onClick={publish} disabled={!canSubmit}
                className="rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 sm:px-5 py-2 disabled:opacity-40 inline-flex items-center gap-2 whitespace-nowrap">
                {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
                {publishing ? t('feed.composer.publishing') : t('feed.composer.publish')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
