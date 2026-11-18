'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Clapperboard, ImagePlus, Loader2, Store, X } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { FeedPost, authHeaders, jsonHeaders } from '@/lib/feedClient';

const MAX_IMAGES = 6;
const MAX_LENGTH = 2000;

interface Props {
  canPost: boolean;
  user: { firstName?: string; lastName?: string; avatarUrl?: string | null } | null;
  onPosted: (post: FeedPost) => void;
}

export function PostComposer({ canPost, user, onPosted }: Props) {
  const { t } = useI18n();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const videoRef = useRef<HTMLInputElement>(null);
  // Кнопка «+» у нижньому меню: відкрити форму або одразу вибір фото/відео
  useEffect(() => {
    const onCompose = (e: Event) => {
      const kind = (e as CustomEvent<string>).detail;
      setOpen(true);
      if (kind === 'photo') fileRef.current?.click();
      if (kind === 'video') videoRef.current?.click();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('svoi:compose', onCompose);
    const kind = new URLSearchParams(window.location.search).get('create');
    if (kind === 'post') setOpen(true);
    return () => window.removeEventListener('svoi:compose', onCompose);
  }, []);
  const [video, setVideo] = useState<{ id: number | null; status: 'uploading' | 'processing' | 'ready' | 'failed'; posterUrl?: string | null }>();

  useEffect(() => {
    if (!video || video.status !== 'processing' || !video.id) return;
    let stop = false;
    const id = video.id;
    const tick = async () => {
      try {
        const res = await fetch(`/api/videos/${id}`, { credentials: 'include', headers: authHeaders() });
        const data = await res.json().catch(() => ({}));
        if (stop) return;
        if (data.video?.status === 'ready') { setVideo({ id, status: 'ready', posterUrl: data.video.posterUrl }); return; }
        if (data.video?.status === 'failed' || !res.ok) { setVideo({ id, status: 'failed' }); return; }
      } catch { /* спробуємо ще раз */ }
      if (!stop) timer = setTimeout(tick, 3000);
    };
    let timer = setTimeout(tick, 2000);
    return () => { stop = true; clearTimeout(timer); };
  }, [video?.id, video?.status]);

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

  const reset = () => { setText(''); setImages([]); setVideo(undefined); setOpen(false); };

  const pickVideo = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error(t('feed.composer.videoTooLarge')); return; }
    setVideo({ id: null, status: 'uploading' });
    try {
      const res = await fetch('/api/videos/upload', { method: 'POST', credentials: 'include', headers: { ...authHeaders(), 'Content-Type': file.type || 'video/mp4' }, body: file });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.video?.id) throw new Error(data.error);
      setVideo({ id: data.video.id, status: 'processing' });
    } catch (e: any) {
      setVideo(undefined);
      toast.error(e?.message || t('feed.composer.uploadFailed'));
    } finally {
      if (videoRef.current) videoRef.current.value = '';
    }
  };

  const removeVideo = () => {
    if (video?.id) fetch(`/api/videos/${video.id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() }).catch(() => undefined);
    setVideo(undefined);
  };


  const pickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - images.length - uploading;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > chosen.length) toast.info(t('feed.composer.maxPhotos', { max: MAX_IMAGES }));
    setUploading((n) => n + chosen.length);
    await Promise.all(chosen.map(async (file) => {
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('type', 'posts');
        const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', headers: authHeaders(), body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error);
        setImages((prev) => [...prev, data.url]);
      } catch (e: any) {
        toast.error(e?.message || t('feed.composer.uploadFailed'));
      } finally {
        setUploading((n) => n - 1);
      }
    }));
    if (fileRef.current) fileRef.current.value = '';
  };

  const publish = async () => {
    if (publishing || uploading > 0 || (video && video.status !== 'ready' && video.status !== 'failed') || (!text.trim() && images.length === 0 && video?.status !== 'ready')) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/posts', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ content: text.trim(), images, videoId: video?.status === 'ready' ? video.id : undefined }) });
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

  const videoBusy = video?.status === 'uploading' || video?.status === 'processing';
  const canSubmit = !publishing && uploading === 0 && !videoBusy && (text.trim().length > 0 || images.length > 0 || video?.status === 'ready');

  return (
    <div className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.12)] p-3 sm:p-4">
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => pickFiles(e.target.files)} />
      <input ref={videoRef} type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={(e) => pickVideo(e.target.files?.[0])} />
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
          <button type="button" onClick={() => { setOpen(true); setTimeout(() => fileRef.current?.click(), 0); }} className="inline-flex items-center justify-center gap-2 rounded-md py-2 text-[14px] font-semibold text-neutral-600 hover:bg-neutral-100">
            <ImagePlus className="w-5 h-5 text-green-600" /> {t('feed.composer.photo')}
          </button>
          <button type="button" onClick={() => { setOpen(true); setTimeout(() => videoRef.current?.click(), 0); }} className="inline-flex items-center justify-center gap-2 rounded-md py-2 text-[14px] font-semibold text-neutral-600 hover:bg-neutral-100">
            <Clapperboard className="w-5 h-5 text-rose-500" /> {t('feed.composer.addVideo')}
          </button>
          <Link href="/projects" className="inline-flex items-center justify-center gap-2 rounded-md py-2 text-[14px] font-semibold text-neutral-600 hover:bg-neutral-100">
            <Store className="w-5 h-5 text-primary-600" /> {t('feed.composer.listing')}
          </Link>
        </div>
      )}

      {open && (
        <>
          {(images.length > 0 || uploading > 0) && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((url) => (
                <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages((prev) => prev.filter((u) => u !== url))} aria-label={t('feed.composer.removePhoto')}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {Array.from({ length: uploading }).map((_, i) => (
                <div key={`u${i}`} className="aspect-square rounded-lg bg-neutral-100 flex items-center justify-center" aria-label={t('feed.composer.uploading')}>
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                </div>
              ))}
            </div>
          )}

          {video && (
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-neutral-100 p-2">
              <div className="w-16 h-16 rounded-md bg-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
                {video.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.posterUrl} alt="" className="w-full h-full object-cover" />
                ) : videoBusy ? <Loader2 className="w-5 h-5 animate-spin text-neutral-400" /> : <Clapperboard className="w-6 h-6 text-neutral-400" />}
              </div>
              <p className={`flex-1 text-sm ${video.status === 'failed' ? 'text-red-600' : 'text-neutral-700'}`}>
                {video.status === 'uploading' ? t('feed.composer.videoUploading') : video.status === 'processing' ? t('feed.composer.videoProcessing') : video.status === 'failed' ? t('feed.composer.videoFailed') : t('feed.composer.addVideo')}
              </p>
              <button type="button" onClick={removeVideo} aria-label={t('feed.composer.removeVideo')} className="h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => videoRef.current?.click()} disabled={!!video && video.status !== 'failed'}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-40">
                <Clapperboard className="w-5 h-5" /> {t('feed.composer.addVideo')}
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={images.length + uploading >= MAX_IMAGES}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-accent-600 hover:bg-accent-50 disabled:opacity-40">
                <ImagePlus className="w-5 h-5" /> {t('feed.composer.addPhoto')}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={reset} className="rounded-full px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100">{t('feed.composer.cancel')}</button>
              <button type="button" onClick={publish} disabled={!canSubmit}
                className="rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2 disabled:opacity-40 inline-flex items-center gap-2">
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
