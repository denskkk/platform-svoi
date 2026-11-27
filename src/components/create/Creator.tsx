'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChevronLeft, ChevronRight, ImageIcon, Loader2, Play, Plus, RefreshCw, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { jsonHeaders } from '@/lib/feedClient';
import { VIDEO_MAX_BYTES } from '@/lib/videoClient';
import { startPublish } from '@/lib/publishQueue';
import { PublishBar } from './PublishBar';
import { nativePlatform, openAppSettings, shellOutdated } from '@/lib/nativeApp';
import { localizedPath } from '@/i18n/routes';

/** Режими студії: «Допис» (фото й відео разом, карусель), «Історія», «Текст». Старі назви photo/reel відкривають «Допис». */
export type CreatorMode = 'text' | 'post' | 'story' | 'photo' | 'reel';
type Mode = 'text' | 'post' | 'story';
const normMode = (m: CreatorMode): Mode => (m === 'photo' || m === 'reel' || m === 'post' ? 'post' : m);
interface Item { id: number; kind: 'image' | 'video'; blob: Blob; url: string }

const MAX_SECONDS = 60;        // збігається з VIDEO_LIMITS.maxSeconds на сервері
const MAX_PHOTOS = 6;          // як у FEED_LIMITS
const MAX_VIDEOS = 4;
const MAX_MEDIA = 10;          // фото й відео разом в одній каруселі
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
  const [mode, setMode] = useState<Mode>(normMode(initialMode));
  const [sel, setSel] = useState(0);
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
  const [busy, setBusy] = useState<string | null>(null); // лише для текстового допису

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

  const allowCamera = () => { camAsked.current = true; startCamera(facing, true); };

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
      startCamera(facing, true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, facing, mode === 'text']);

  // Після системного запиту дозволу / згортання застосунку потік може обірватися — відновлюємо
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || (!camAsked.current && camRef.current !== 'denied') || preview || mode === 'text' || recRef.current) return;
      const live = streamRef.current?.getTracks().some((tr) => tr.readyState === 'live');
      if (!live) { camAsked.current = true; startCamera(facing, true); }
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

  const addItem = (kind: 'image' | 'video', blob: Blob): boolean => {
    const prev = itemsRef.current;
    if (mode !== 'story') {
      if (prev.length >= MAX_MEDIA) { toast.info(t('feed.composer.maxMedia', { max: MAX_MEDIA })); return false; }
      if (kind === 'image' && prev.filter((p) => p.kind === 'image').length >= MAX_PHOTOS) { toast.info(t('feed.composer.maxPhotos', { max: MAX_PHOTOS })); return false; }
      if (kind === 'video' && prev.filter((p) => p.kind === 'video').length >= MAX_VIDEOS) { toast.info(t('feed.composer.maxVideos', { max: MAX_VIDEOS })); return false; }
    }
    const it: Item = { id: ++seq, kind, blob, url: URL.createObjectURL(blob) };
    if (mode === 'story') prev.forEach((p) => URL.revokeObjectURL(p.url));
    itemsRef.current = mode === 'story' ? [it] : prev.concat(it);
    setItems(itemsRef.current);
    setSel(itemsRef.current.length - 1);
    setPreview(true);
    return true;
  };

  const removeItem = (id: number) => {
    const it = itemsRef.current.find((x) => x.id === id);
    if (it) URL.revokeObjectURL(it.url);
    itemsRef.current = itemsRef.current.filter((x) => x.id !== id);
    setItems(itemsRef.current);
    setSel((s0) => Math.max(0, Math.min(s0, itemsRef.current.length - 1)));
    if (!itemsRef.current.length) setPreview(false);
  };

  const moveItem = (id: number, dir: -1 | 1) => {
    const list = itemsRef.current.slice();
    const i = list.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    itemsRef.current = list; setItems(list); setSel(j);
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

  // Кнопка затвора (допис і історія): тап = фото, утримання = відео до 60 с
  const down = () => {
    heldRef.current = false;
    holdRef.current = setTimeout(() => { heldRef.current = true; startRec(); }, HOLD_MS);
  };
  const up = () => {
    if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; }
    if (heldRef.current) stopRec(); else takePhoto();
  };

  /** Галерея: можна вибрати кілька файлів, фото й відео разом — кожен стає слайдом каруселі у порядку вибору. */
  const fromFiles = async (files: FileList | null, forceKind?: 'image' | 'video') => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, mode === 'story' ? 1 : MAX_MEDIA);
    let added = 0, bad = 0;
    for (const f of list) {
      const isVideo = f.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|3gp)$/i.test(f.name);
      if (isVideo && forceKind !== 'image') {
        if (f.size > VIDEO_MAX_BYTES) { toast.error(t('cabinet.studio.tooLarge')); continue; }
        if (addItem('video', f)) added++;
      } else if (f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)) {
        if (addItem('image', await shrink(f))) added++;
      } else bad++;
    }
    if (!added && bad) toast.error(t('cabinet.studio.badFile'));
  };

  const back = () => {
    itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url)); itemsRef.current = []; setItems([]); setCaption(''); setPreview(false); setSel(0);
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url)); itemsRef.current = []; setItems([]); setPreview(false); setSel(0);
    setMode(m);
  };

  const publish = async () => {
    if (busy) return;
    if (mode === 'text') {
      if (!caption.trim()) return;
      setBusy(t('cabinet.studio.uploading'));
      try {
        const r = await fetch('/api/posts', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ content: caption.trim(), requestId: `${Date.now()}-${Math.random().toString(36).slice(2)}` }) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error);
        toast.success(t('cabinet.studio.published'));
        onClose();
        const here = window.location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
        if (here === '/feed') window.location.reload(); else router.push(localizedPath('/feed', locale));
      } catch (e: any) {
        toast.error(e?.message || t('feed.composer.uploadFailed'));
        setBusy(null);
      }
      return;
    }
    if (!items.length) return;
    // Фото/відео вантажаться у фоні: студія закривається одразу, прогрес — у плашці внизу (повтор при збої — без повторного вантаження готового)
    const ok = startPublish(items.map((i) => ({ kind: i.kind, blob: i.blob })), caption, mode, t);
    if (!ok) { toast.info(t('cabinet.studio.busyJob')); return; }
    onClose();
  };

  const tabs: Array<[Mode, string]> = [['post', t('cabinet.studio.modePost')], ['story', t('cabinet.studio.modeStory')], ['text', t('cabinet.studio.modeText')]];
  const acceptGallery = 'image/*,video/mp4,video/quicktime,video/webm';
  const circ = 2 * Math.PI * 38;
  const hint = t('cabinet.studio.hintStory');
  const nameOf = (m: Mode) => (m === 'text' ? t('cabinet.studio.modeText') : m === 'post' ? t('cabinet.studio.modePost') : t('cabinet.studio.modeStory'));
  const cur = items[Math.min(sel, items.length - 1)];
  const curIdx = cur ? items.indexOf(cur) : 0;

  return (
    <div style={{ top: 'var(--vv-top, 0px)', height: 'var(--vvh, 100dvh)' }} className="fixed inset-x-0 z-[80] bg-black text-white select-none overscroll-none" role="dialog" aria-modal="true" aria-label={nameOf(mode)}>
      <input ref={galleryRef} type="file" accept={acceptGallery} multiple={mode === 'post'} hidden onChange={(e) => { fromFiles(e.target.files); e.target.value = ''; }} />
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
              <button key={m} type="button" disabled={!!busy} onClick={() => switchMode(m)} className={`px-1 pb-1 border-b-2 ${mode === m ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400'}`}>{label}</button>
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
                    {!shellOutdated() && <button type="button" onClick={() => cameraPhotoRef.current?.click()} className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-bold">{t('cabinet.studio.systemCamera')}</button>}
                    {!shellOutdated() && <button type="button" onClick={() => cameraVideoRef.current?.click()} className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-bold">{t('cabinet.studio.systemVideo')}</button>}
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
                aria-label={recording ? t('cabinet.studio.stop') : t('cabinet.studio.shutter')} className="relative h-20 w-20 touch-none disabled:opacity-40">
                <svg viewBox="0 0 88 88" className="absolute inset-0 h-full w-full -rotate-90"><circle cx="44" cy="44" r="38" fill="none" stroke="white" strokeOpacity=".4" strokeWidth="6" />
                  {recording && <circle cx="44" cy="44" r="38" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(1, seconds / MAX_SECONDS))} />}</svg>
                <span className={`absolute transition-all ${recording ? 'inset-6 rounded-lg bg-red-500' : 'inset-3 rounded-full bg-white'}`} />
              </button>
              {items.length > 0 && mode === 'post'
                ? <button type="button" onClick={() => setPreview(true)} disabled={recording} aria-label={t('cabinet.studio.addedCount', { count: items.length })} className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 font-extrabold text-neutral-900">{items.length}<span className="sr-only">{t('cabinet.studio.addedCount', { count: items.length })}</span></button>
                : <span className="h-12 w-12" aria-hidden />}
            </div>
            <div className="mt-4 flex justify-center gap-6 text-sm font-bold">
              {tabs.map(([m, label]) => (
                <button key={m} type="button" disabled={recording} onClick={() => switchMode(m)} className={`px-1 pb-1 border-b-2 ${mode === m ? 'border-white text-white' : 'border-transparent text-white/60'}`}>{label}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {preview && mode !== 'text' && cur && (
        <>
          <div className="absolute inset-0 bg-black">
            {cur.kind === 'video'
              ? <video key={cur.id} src={cur.url} playsInline autoPlay loop controls={false} muted={false} className="h-full w-full object-contain" onClick={(e) => { const v = e.currentTarget; if (v.paused) v.play(); else v.pause(); }} />
              // eslint-disable-next-line @next/next/no-img-element
              : <img key={cur.id} src={cur.url} alt="" className="h-full w-full object-contain" />}
          </div>
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[calc(1rem+var(--safe-area-inset-top,0px))] bg-gradient-to-b from-black/60 to-transparent">
            <button type="button" onClick={back} aria-label={t('cabinet.studio.retake')} className="rounded-full bg-black/40 p-2.5"><X className="h-6 w-6" /></button>
            <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-bold">{nameOf(mode)}{mode === 'post' && items.length > 1 ? ` · ${curIdx + 1}/${items.length}` : ''}</span>
            <span className="w-11" aria-hidden />
          </div>
          <div className="absolute inset-x-0 bottom-0 space-y-3 p-4 pb-[calc(1rem+var(--safe-area-inset-bottom,0px))] bg-gradient-to-t from-black/85 via-black/60 to-transparent pt-12">
            {mode === 'post' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1" role="list">
                {items.map((it, i) => (
                  <div key={it.id} role="listitem" className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ${it.id === cur.id ? 'ring-2 ring-primary-400' : 'opacity-80'}`}>
                    <button type="button" onClick={() => setSel(i)} aria-label={`${i + 1}`} className="h-full w-full">
                      {it.kind === 'video'
                        ? <video src={it.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                        // eslint-disable-next-line @next/next/no-img-element
                        : <img src={it.url} alt="" className="h-full w-full object-cover" />}
                    </button>
                    {it.kind === 'video' && <span className="pointer-events-none absolute bottom-0.5 left-0.5 rounded-full bg-black/60 p-0.5"><Play className="h-3 w-3 fill-white" aria-hidden /></span>}
                    <button type="button" onClick={() => removeItem(it.id)} aria-label={t('cabinet.studio.remove')} className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                {items.length < MAX_MEDIA && (
                  <button type="button" onClick={() => setPreview(false)} aria-label={t('cabinet.studio.addMore')} className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/60 text-white"><Plus className="h-6 w-6" /></button>
                )}
              </div>
            )}
            {mode === 'post' && items.length > 1 && cur && (
              <div className="flex items-center justify-between">
                <button type="button" disabled={curIdx === 0} onClick={() => moveItem(cur.id, -1)} aria-label={t('feed.composer.moveEarlier')} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold disabled:opacity-30"><ChevronLeft className="h-4 w-4" />{t('feed.composer.moveEarlier')}</button>
                <span className="text-xs text-white/70">{t('feed.composer.mediaCount', { count: items.length, max: MAX_MEDIA })}</span>
                <button type="button" disabled={curIdx === items.length - 1} onClick={() => moveItem(cur.id, 1)} aria-label={t('feed.composer.moveLater')} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold disabled:opacity-30">{t('feed.composer.moveLater')}<ChevronRight className="h-4 w-4" /></button>
              </div>
            )}
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={mode === 'story' ? 200 : 2000} rows={2} placeholder={mode === 'story' ? t('cabinet.studio.captionStory') : t('cabinet.studio.caption')} aria-label={t('cabinet.studio.caption')}
              className="w-full resize-none rounded-2xl border border-white/30 bg-black/40 px-4 py-2.5 text-base text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-400" />
            <button type="button" onClick={publish} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-500 py-3 font-extrabold text-neutral-900 active:scale-[0.98] transition">
              {t('cabinet.studio.publish')}
            </button>
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
      if (d.mode === 'text' || d.mode === 'post' || d.mode === 'photo' || d.mode === 'story' || d.mode === 'reel') { setCaption(typeof d.caption === 'string' ? d.caption : ''); setMode(d.mode); }
    };
    window.addEventListener('svoi:create', on);
    return () => window.removeEventListener('svoi:create', on);
  }, []);
  return <><span data-creator-host hidden /><PublishBar />{mode ? <Creator key={normMode(mode)} initialMode={mode} initialCaption={caption} onClose={() => setMode(null)} /> : null}</>;
}
