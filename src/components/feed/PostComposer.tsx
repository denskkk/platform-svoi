'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ImagePlus, Loader2, X } from 'lucide-react';
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

  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  if (!canPost) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-4 flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">{t('feed.composer.viewerNotice')}</p>
        <Link href="/auth/register" className="shrink-0 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2">
          {t('feed.composer.viewerAction')}
        </Link>
      </div>
    );
  }

  const reset = () => { setText(''); setImages([]); setOpen(false); };

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
    if (publishing || uploading > 0 || (!text.trim() && images.length === 0)) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/posts', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ content: text.trim(), images }) });
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

  const canSubmit = !publishing && uploading === 0 && (text.trim().length > 0 || images.length > 0);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-4">
      <div className="flex gap-3">
        <UserAvatar src={user?.avatarUrl} alt={name} fallbackName={name || '?'} className="w-11 h-11 rounded-full shrink-0" />
        {!open ? (
          <button type="button" onClick={() => setOpen(true)} className="flex-1 text-left rounded-full bg-neutral-50 hover:bg-neutral-100 px-4 text-neutral-500 text-[15px]">
            {t('feed.composer.prompt')}
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

          <div className="mt-3 flex items-center justify-between gap-2">
            <div>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => pickFiles(e.target.files)} />
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
