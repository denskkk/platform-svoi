'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ImageIcon, Loader2, Plus, RefreshCw, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';
import { uploadVideo, waitVideoReady, VIDEO_MAX_BYTES } from '@/lib/videoClient';
import { localizedPath } from '@/i18n/routes';

export type CreatorMode = 'text' | 'photo' | 'story' | 'reel';
interface Item { id: number; kind: 'image' | 'video'; blob: Blob; url: string }

const MAX_SECONDS = 60;        // збігається з VIDEO_LIMITS.maxSeconds на сервері
const MAX_PHOTOS = 6;          // як у PostComposer
const HOLD_MS = 350;
let seq = 0;

/** Стиснення знімка: довга сторона до 1600 px, JPEG 0.85. Якщо браузер не вміє (HEIC) — лишається оригінал. */
async function shrink(blob: Blob): Promise<Blob> {
  try {
    if (blob.size < 1.2 * 1024 * 1024 || !blob.type.startsWith('image/')) return blob;
    const bmp = await createImageBitmap(blob);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const out: Blob | null = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85));
    return out && out.size < blob.size ? out : blob;
  } catch { return blob; }
}

type CamState = 'starting' | 'on' | 'off' | 'ask' | 'denied';

/** Стан дозволу камери без запиту (Permissions API є не скрізь — тоді 'unknown'). */
async function cameraPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  try {
    const q = await (navigator as any).permissions?.query?.({ name: 'camera' });
    return q?.state ?? 'unknown';
  } catch { return 'unknown'; }
}

const nativePlatform = (): 'ios' | 'android' | 'web' => {
  try { const p = (window as any).Capacitor?.getPlatform?.(); return p === 'ios' || p === 'android' ? p : 'web'; } catch { return 'web'; }
};
/** iPhone: iOS відкриває налаштування застосунку за схемою app-settings:. На Android безпечного способу без плагіна немає — лише інструкція. */
const openAppSettings = () => { try { window.location.href = 'app-settings:'; } catch { /* ignore */ } };

const pickMime = () => ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(m)) || '';

/**
 * Повноекранна студія створення, як у TikTok / Instagram: камера, фото натиском, відео утриманням (історія) або таймером (рілс, до 60 с),
 * перемикання камер, галерея, перегляд із підписом і публікація (історія, допис із фото, допис-відео у «Рілси»).
 * Якщо камера недоступна (немає дозволу / стара оболонка) — працюють системні вибір із галереї та знімок через системну камеру.
 */
export function Creator({ initialMode, initialCaption = '', onClose }: { initialMode: CreatorMode; initialCaption?: string; onClose: () => void }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<CreatorMode>(initialMode);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [camera, setCamera] = useState<CamState>('starting');
  const [camErr, setCamErr] = useState('');
  const camRef = useRef<CamState>('starting');
  camRef.current = camera;
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [preview, setPreview] = useState(false);
  const [caption, setCaption] = useState(initialCaption);
  const [busy, setBusy] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraPhotoRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;

  const stopStream = useCallback(() => { streamRef.current?.getTracks().forEach((tr) => tr.stop()); streamRef.current = null; }, []);

  const camAsked = useRef(false); // користувач уже дозволив камеру в цій сесії студії

  const startCamera = useCallback(async (face: 'user' | 'environment', withAudio: boolean) => {
    stopStream();
    if (!navigator.mediaDevices?.getUserMedia) { setCamera('off'); return; }
    setCamera('starting'); setCamErr('');
    // 720p вистачає для рілсів і значно легший для телефона (пам’ять, нагрів, розмір файлу)
    const video = { facingMode: face, width: { ideal: 720 }, height: { ideal: 1280 } };
    const open = (audio: boolean) => navigator.mediaDevices.getUserMedia({ video, audio });
    try {
      let s: MediaStream;
      try { s = await open(withAudio); }
      catch (e: any) {
        const name = e?.name || '';
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          // мікрофон заборонено, а камера дозволена — знімаємо без звуку; інакше показуємо екран «потрібен дозвіл» (без повторного запиту)
          if (withAudio && (await cameraPermission()) === 'granted') s = await open(false);
          else { setCamera('denied'); return; }
        } else if (withAudio) { s = await open(false); } // немає мікрофона / не вдалося його відкрити
        else throw e;
      }
      streamRef.current = s;
      const el = videoRef.current;
      if (el) { el.srcObject = s; await el.play().catch(() => undefined); }
      setCamera('on');
    } catch (e: any) {
      setCamErr(String(e?.name || e?.message || '').slice(0, 40));
      setCamera(e?.name === 'NotAllowedError' ? 'denied' : 'off');
    }
  }, [stopStream]);

  const allowCamera = () => { camAsked.current = true; startCamera(facing, mode !== 'photo'); };

  // Камеру вмикаємо САМІ лише коли дозвіл уже є; інакше — спершу зрозумілий екран із кнопкою (не раптовий системний запит при відкритті студії)
  useEffect(() => {
    if (preview || mode === 'text') { stopStream(); return; }
    let cancelled = false;
    (async () => {
      if (!camAsked.current) {
        const st = await cameraPermission();
        if (cancelled) return;
        if (st === 'denied') { setCamErr('denied'); setCamera('denied'); return; }
        if (st !== 'granted') { setCamera('ask'); return; }
        camAsked.current = true;
      }
      startCamera(facing, mode !== 'photo');
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, facing, mode === 'photo', mode === 'text']);

  // Після системного запиту дозволу / згортання застосунку потік може обірватися — відновлюємо
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || (!camAsked.current && camRef.current !== 'denied') || preview || mode === 'text' || recRef.current) return;
      const live = streamRef.current?.getTracks().some((tr) => tr.readyState === 'live');
      if (!live) { camAsked.current = true; startCamera(facing, mode !== 'photo'); }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [preview, mode, facing, startCamera]);

  useEffect(() => () => {
    stopStream();
    if (tickRef.current) clearInterval(tickRef.current);
    if (holdRef.current) clearTimeout(holdRef.current);
    itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url));
  }, [stopStream]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose, busy]);

  const addItem = (kind: 'image' | 'video', blob: Blob) => {
    const it: Item = { id: ++seq, kind, blob, url: URL.createObjectURL(blob) };
    setItems((prev) => {
      if (mode === 'photo' && kind === 'image') return prev.filter((p) => p.kind === 'image').concat(it).slice(0, MAX_PHOTOS);
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [it];
    });
    setPreview(true);
  };

  const takePhoto = async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.88));
    if (blob) addItem('image', blob);
  };

  const startRec = () => {
    const s = streamRef.current;
    if (!s || recRef.current || typeof MediaRecorder === 'undefined') { if (typeof MediaRecorder === 'undefined') cameraVideoRef.current?.click(); return; }
    const mimeType = pickMime();
    chunksRef.current = [];
    const rec = new MediaRecorder(s, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 2_000_000 });
    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const type = (rec.mimeType || mimeType || 'video/webm').split(';')[0];
      const blob = new Blob(chunksRef.current, { type });
      recRef.current = null; setRecording(false); setSeconds(0);
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      if (blob.size < 1000) return;
      if (blob.size > VIDEO_MAX_BYTES) { toast.error(t('cabinet.studio.tooLarge')); return; }
      addItem('video', blob);
    };
    recRef.current = rec; rec.start(500); setRecording(true); setSeconds(0);
    const t0 = Date.now();
    tickRef.current = setInterval(() => {
      const sec = Math.floor((Date.now() - t0) / 1000);
      setSeconds(sec);
      if (sec >= MAX_SECONDS) stopRec();
    }, 250);
  };
  const stopRec = () => { if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop(); };

  // Кнопка затвора: у «Історії» тап = фото, утримання = відео; у «Рілсі» тап починає/зупиняє запис; у «Фото» тап = знімок
  const down = () => {
    heldRef.current = false;
    if (mode === 'story') holdRef.current = setTimeout(() => { heldRef.current = true; startRec(); }, HOLD_MS);
  };
  const up = () => {
    if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; }
    if (mode === 'story') { if (heldRef.current) stopRec(); else takePhoto(); return; }
    if (mode === 'reel') { if (recRef.current) stopRec(); else startRec(); return; }
    takePhoto();
  };

  const fromFiles = async (files: FileList | null, forceKind?: 'image' | 'video') => {
    if (!files?.length) return;
    const list = Array.from(files);
    const vid = list.find((f) => f.type.startsWith('video/'));
    if (vid && forceKind !== 'image' && mode !== 'photo') {
      if (vid.size > VIDEO_MAX_BYTES) { toast.error(t('cabinet.studio.tooLarge')); return; }
      addItem('video', vid); return;
    }
    const imgs = list.filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    if (!imgs.length) { toast.error(t('cabinet.studio.badFile')); return; }
    for (const f of imgs.slice(0, mode === 'photo' ? MAX_PHOTOS : 1)) addItem('image', await shrink(f));
  };

  const back = () => {
    items.forEach((i) => URL.revokeObjectURL(i.url)); setItems([]); setCaption(''); setPreview(false);
  };

  const uploadImage = async (blob: Blob) => {
    const form = new FormData();
    form.append('file', new File([blob], blob.type === 'image/png' ? 'photo.png' : 'photo.jpg', { type: blob.type || 'image/jpeg' }));
    form.append('type', 'posts');
    const r = await fetch('/api/upload', { method: 'POST', credentials: 'include', headers: authHeaders(), body: form });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.url) throw new Error(d.error);
    return d.url as string;
  };
  const uploadVideoItem = async (blob: Blob) => {
    const id = await uploadVideo(blob, t, (pct) => setBusy(`${t('cabinet.studio.uploading')} ${pct}%`));
    setBusy(t('cabinet.studio.processing'));
    return waitVideoReady(id, t);
  };

  const publish = async () => {
    if (busy || (mode !== 'text' && !items.length)) return;
    if (mode === 'text' && !caption.trim()) return;
    setBusy(t('cabinet.studio.uploading'));
    try {
      const first = items[0];
      let go = '/feed';
      if (mode === 'text') {
        const r = await fetch('/api/posts', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ content: caption.trim() }) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error);
      } else if (mode === 'story') {
        const body: Record<string, unknown> = { caption: caption.trim() };
        if (first.kind === 'video') body.videoId = await uploadVideoItem(first.blob); else body.imageUrl = await uploadImage(first.blob);
        const r = await fetch('/api/stories', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(body) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error);
        window.dispatchEvent(new Event('svoi:stories-changed'));
      } else {
        const body: Record<string, unknown> = { content: caption.trim() };
        if (first.kind === 'video') { body.videoId = await uploadVideoItem(first.blob); go = '/video'; }
        else { const urls: string[] = []; for (const it of items.filter((x) => x.kind === 'image')) urls.push(await uploadImage(it.blob)); body.images = urls; }
        const r = await fetch('/api/posts', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(body) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error);
      }
      toast.success(t(mode === 'story' ? 'feed.stories.added' : 'cabinet.studio.published'));
      onClose();
      const here = window.location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
      if (mode === 'story' && here === '/feed') return;
      if (here === go) window.location.reload(); else router.push(localizedPath(go, locale));
    } catch (e: any) {
      toast.error(e?.message || t('feed.composer.uploadFailed'));
      setBusy(null);
    }
  };

  const tabs: Array<[CreatorMode, string]> = [['text', t('cabinet.studio.modeText')], ['photo', t('cabinet.studio.modePost')], ['story', t('cabinet.studio.modeStory')], ['reel', t('cabinet.studio.modeReel')]];
  const acceptGallery = mode === 'photo' ? 'image/*' : mode === 'story' ? 'image/*,video/mp4,video/quicktime,video/webm' : 'video/mp4,video/quicktime,video/webm';
  const circ = 2 * Math.PI * 38;
  const hint = mode === 'story' ? t('cabinet.studio.hintStory') : mode === 'reel' ? t('cabinet.studio.hintReel') : t('cabinet.studio.hintPhoto');
  const nameOf = (m: CreatorMode) => (m === 'text' ? t('cabinet.studio.modeText') : m === 'photo' ? t('cabinet.studio.modePost') : m === 'story' ? t('cabinet.studio.modeStory') : t('cabinet.studio.modeReel'));

  return (
    <div className="fixed inset-x-0 top-0 z-[80] h-[100dvh] bg-black text-white select-none overscroll-none" role="dialog" aria-modal="true" aria-label={nameOf(mode)}>
      <input ref={galleryRef} type="file" accept={acceptGallery} multiple={mode === 'photo'} hidden onChange={(e) => { fromFiles(e.target.files); e.target.value = ''; }} />
      <input ref={cameraPhotoRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { fromFiles(e.target.files, 'image'); e.target.value = ''; }} />
      <input ref={cameraVideoRef} type="file" accept="video/*" capture="environment" hidden onChange={(e) => { fromFiles(e.target.files); e.target.value = ''; }} />

      {mode === 'text' && (
        <div className="absolute inset-0 flex flex-col bg-white text-neutral-900">
          <div className="flex items-center justify-between p-4 pt-[calc(1rem+var(--safe-area-inset-top,0px))] border-b border-neutral-200">
            <button type="button" onClick={onClose} disabled={!!busy} aria-label={t('cabinet.create.close')} className="rounded-full p-2 hover:bg-neutral-100"><X className="h-6 w-6" /></button>
            <span className="font-bold">{nameOf('text')}</span>
            <button type="button" onClick={publish} disabled={!!busy || !caption.trim()} className="rounded-full bg-primary-500 px-5 py-2 font-extrabold text-neutral-900 disabled:opacity-50 inline-flex items-center gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{t('cabinet.studio.publish')}</button>
          </div>
          <textarea autoFocus value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={2000} disabled={!!busy} placeholder={t('cabinet.studio.textPlaceholder')} aria-label={t('cabinet.studio.textPlaceholder')} className="flex-1 resize-none p-4 text-lg focus:outline-none" />
          <p className="px-4 pb-1 text-right text-xs text-neutral-400">{caption.length}/2000</p>
          <div className="flex justify-center gap-6 border-t border-neutral-200 py-3 pb-[calc(0.75rem+var(--safe-area-inset-bottom,0px))] text-sm font-bold">
            {tabs.map(([m, label]) => (
              <button key={m} type="button" disabled={!!busy} onClick={() => setMode(m)} className={`px-1 pb-1 border-b-2 ${mode === m ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400'}`}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {!preview && mode !== 'text' && (
        <>
          <video ref={videoRef} playsInline muted autoPlay className={`absolute inset-0 h-full w-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`} />
          {camera !== 'on' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-gradient-to-b from-[#0a1f44] to-neutral-900 px-8 py-24 text-center">
              {camera === 'starting' ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                <>
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10"><Camera className="h-8 w-8 text-primary-400" /></span>
                  <p className="text-lg font-bold">{camera === 'ask' ? t('cabinet.studio.askTitle') : camera === 'denied' ? t('cabinet.studio.deniedTitle') : t('cabinet.studio.noCameraTitle')}</p>
                  <p className="max-w-xs text-sm text-white/75">{camera === 'ask' ? t('cabinet.studio.askText') : camera === 'denied' ? t(nativePlatform() === 'ios' ? 'cabinet.studio.deniedIos' : nativePlatform() === 'android' ? 'cabinet.studio.deniedAndroid' : 'cabinet.studio.denied') : t('cabinet.studio.noCamera')}</p>
                  {camera === 'denied' && nativePlatform() === 'ios' && <button type="button" onClick={openAppSettings} className="mt-1 w-full max-w-xs rounded-full bg-primary-500 px-6 py-3 font-extrabold text-neutral-900 active:scale-95 transition">{t('cabinet.studio.openSettings')}</button>}
                  {camera === 'ask' && <button type="button" onClick={allowCamera} className="mt-1 w-full max-w-xs rounded-full bg-primary-500 px-6 py-3 font-extrabold text-neutral-900 active:scale-95 transition">{t('cabinet.studio.allow')}</button>}
                  {camera === 'denied' && <button type="button" onClick={allowCamera} className={nativePlatform() === 'ios' ? 'w-full max-w-xs rounded-full border border-white/40 px-6 py-2.5 text-sm font-bold' : 'mt-1 w-full max-w-xs rounded-full bg-primary-500 px-6 py-3 font-extrabold text-neutral-900 active:scale-95 transition'}>{t('cabinet.studio.retry')}</button>}
                  {camera === 'off' && <button type="button" onClick={allowCamera} className="mt-1 w-full max-w-xs rounded-full bg-primary-500 px-6 py-3 font-extrabold text-neutral-900 active:scale-95 transition">{t('cabinet.studio.retry')}</button>}
                  <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
                    {mode !== 'reel' && <button type="button" onClick={() => cameraPhotoRef.current?.click()} className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-bold">{t('cabinet.studio.systemCamera')}</button>}
                    {mode !== 'photo' && <button type="button" onClick={() => cameraVideoRef.current?.click()} className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-bold">{t('cabinet.studio.systemVideo')}</button>}
                    <button type="button" onClick={() => galleryRef.current?.click()} className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-bold">{t('cabinet.studio.gallery')}</button>
                  </div>
                  {camErr && <p className="mt-1 text-[11px] text-white/40">{camErr}</p>}
                </>
              )}
            </div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[calc(1rem+var(--safe-area-inset-top,0px))] bg-gradient-to-b from-black/60 to-transparent">
            <button type="button" onClick={onClose} aria-label={t('cabinet.create.close')} className="rounded-full bg-black/40 p-2.5"><X className="h-6 w-6" /></button>
            {recording && <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold tabular-nums">● {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>}
            <button type="button" onClick={() => !recording && setFacing((f) => (f === 'user' ? 'environment' : 'user'))} aria-label={t('cabinet.studio.flip')} disabled={camera !== 'on' || recording} className="rounded-full bg-black/40 p-2.5 disabled:opacity-40"><RefreshCw className="h-6 w-6" /></button>
          </div>
          <div className="absolute inset-x-0 bottom-0 pb-[calc(1rem+var(--safe-area-inset-bottom,0px))] pt-10 bg-gradient-to-t from-black/70 to-transparent">
            <p className="mb-3 text-center text-xs text-white/80">{hint}</p>
            <div className="flex items-center justify-around px-6">
              <button type="button" onClick={() => galleryRef.current?.click()} aria-label={t('cabinet.studio.gallery')} className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border-2 border-white/80 bg-black/40"><ImageIcon className="h-6 w-6" /></button>
              <button type="button" disabled={camera !== 'on'} onPointerDown={(e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ } down(); }} onPointerUp={up} onPointerCancel={() => { if (holdRef.current) clearTimeout(holdRef.current); if (heldRef.current) stopRec(); }} onContextMenu={(e) => e.preventDefault()}
                aria-label={mode === 'reel' ? (recording ? t('cabinet.studio.stop') : t('cabinet.studio.record')) : t('cabinet.studio.shutter')} className="relative h-20 w-20 touch-none disabled:opacity-40">
                <svg viewBox="0 0 88 88" className="absolute inset-0 h-full w-full -rotate-90"><circle cx="44" cy="44" r="38" fill="none" stroke="white" strokeOpacity=".4" strokeWidth="6" />
                  {recording && <circle cx="44" cy="44" r="38" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(1, seconds / MAX_SECONDS))} />}</svg>
                <span className={`absolute transition-all ${recording ? 'inset-6 rounded-lg bg-red-500' : mode === 'photo' ? 'inset-3 rounded-full bg-white' : 'inset-3 rounded-full bg-red-500'}`} />
              </button>
              <span className="h-12 w-12" aria-hidden />
            </div>
            <div className="mt-4 flex justify-center gap-6 text-sm font-bold">
              {tabs.map(([m, label]) => (
                <button key={m} type="button" disabled={recording} onClick={() => setMode(m)} className={`px-1 pb-1 border-b-2 ${mode === m ? 'border-white text-white' : 'border-transparent text-white/60'}`}>{label}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {preview && mode !== 'text' && (
        <>
          <div className="absolute inset-0 bg-black">
            {items[0]?.kind === 'video'
              ? <video src={items[0].url} playsInline autoPlay loop controls={false} muted={false} className="h-full w-full object-contain" onClick={(e) => { const v = e.currentTarget; if (v.paused) v.play(); else v.pause(); }} />
              : mode === 'photo' && items.length > 1
                ? <ul className="grid h-full grid-cols-2 gap-1 overflow-y-auto p-1 pt-20 pb-60">{items.map((i) => <li key={i.id} className="relative aspect-square"><img src={i.url} alt="" className="h-full w-full rounded-lg object-cover" /><button type="button" aria-label={t('cabinet.studio.remove')} onClick={() => setItems((p) => { const n = p.filter((x) => x.id !== i.id); URL.revokeObjectURL(i.url); if (!n.length) setPreview(false); return n; })} className="absolute right-1 top-1 rounded-full bg-black/60 p-1"><X className="h-4 w-4" /></button></li>)}</ul>
                : <img src={items[0]?.url} alt="" className="h-full w-full object-contain" />}
          </div>
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[calc(1rem+var(--safe-area-inset-top,0px))] bg-gradient-to-b from-black/60 to-transparent">
            <button type="button" onClick={back} disabled={!!busy} aria-label={t('cabinet.studio.retake')} className="rounded-full bg-black/40 p-2.5"><X className="h-6 w-6" /></button>
            <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-bold">{nameOf(mode)}</span>
            <span className="w-11" aria-hidden />
          </div>
          <div className="absolute inset-x-0 bottom-0 space-y-3 p-4 pb-[calc(1rem+var(--safe-area-inset-bottom,0px))] bg-gradient-to-t from-black/80 to-transparent pt-12">
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={mode === 'story' ? 200 : 2000} rows={2} disabled={!!busy} placeholder={mode === 'story' ? t('cabinet.studio.captionStory') : t('cabinet.studio.caption')} aria-label={t('cabinet.studio.caption')}
              className="w-full resize-none rounded-2xl border border-white/30 bg-black/40 px-4 py-2.5 text-base text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-400" />
            <div className="flex gap-2">
              {mode === 'photo' && items[0]?.kind === 'image' && items.length < MAX_PHOTOS && <button type="button" onClick={() => setPreview(false)} disabled={!!busy} className="inline-flex items-center gap-1 rounded-full border border-white/60 px-4 py-3 font-bold"><Plus className="h-5 w-5" />{t('cabinet.studio.addMore')}</button>}
              <button type="button" onClick={publish} disabled={!!busy} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary-500 py-3 font-extrabold text-neutral-900 disabled:opacity-60">
                {busy ? <><Loader2 className="h-5 w-5 animate-spin" />{busy}</> : t('cabinet.studio.publish')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Слухає подію svoi:create { mode } і відкриває студію; монтується один раз (нижнє меню). */
export function CreatorHost() {
  const [mode, setMode] = useState<CreatorMode | null>(null);
  const [caption, setCaption] = useState('');
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (d.mode === 'text' || d.mode === 'photo' || d.mode === 'story' || d.mode === 'reel') { setCaption(typeof d.caption === 'string' ? d.caption : ''); setMode(d.mode); }
    };
    window.addEventListener('svoi:create', on);
    return () => window.removeEventListener('svoi:create', on);
  }, []);
  return <><span data-creator-host hidden />{mode ? <Creator key={mode} initialMode={mode} initialCaption={caption} onClose={() => setMode(null)} /> : null}</>;
}
