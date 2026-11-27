/**
 * Фонова публікація з студії створення (як у TikTok): студія закривається одразу після «Опублікувати»,
 * а завантаження фото/відео, очікування обробки і саме створення допису/історії йдуть у фоні з індикатором прогресу.
 * Те, що вже завантажено, при повторі не вантажиться ще раз; запит створення має requestId — дубля допису не буде.
 */
import { authHeaders, jsonHeaders } from '@/lib/feedClient';
import { uploadVideo, waitVideoReady } from '@/lib/videoClient';

type T = (key: string, params?: Record<string, string | number>) => string;
export interface PubItem { kind: 'image' | 'video'; blob: Blob }
export type PubKind = 'post' | 'story';
export interface PubState {
  kind: PubKind;
  status: 'running' | 'done' | 'failed';
  phase: 'upload' | 'processing' | 'saving';
  pct: number;
  error?: string;
  /** Куди вести після успіху */
  go: string;
}

interface Job { items: PubItem[]; caption: string; kind: PubKind; requestId: string; urls: Array<string | undefined>; vids: Array<number | undefined>; ready: boolean[]; t: T }

let job: Job | null = null;
let state: PubState | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const getPublish = () => state;
export const subscribePublish = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const publishRunning = () => state?.status === 'running';

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

async function uploadImage(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append('file', new File([blob], blob.type === 'image/png' ? 'photo.png' : 'photo.jpg', { type: blob.type || 'image/jpeg' }));
  form.append('type', 'posts');
  const r = await fetch('/api/upload', { method: 'POST', credentials: 'include', headers: authHeaders(), body: form });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.url) throw new Error(d.error || 'upload');
  return d.url as string;
}

async function run() {
  if (!job || !state) return;
  const j = job;
  state = { ...state, status: 'running', phase: 'upload', error: undefined };
  emit();
  try {
    const n = j.items.length;
    const prog: number[] = j.items.map((_, i) => (j.ready[i] ? 100 : 0));
    const sync = () => { if (state) { state = { ...state, pct: Math.round(prog.reduce((a, b) => a + b, 0) / n) }; emit(); } };
    sync();
    await Promise.all(j.items.map(async (it, i) => {
      if (j.ready[i]) return;
      if (it.kind === 'image') {
        j.urls[i] = await uploadImage(it.blob);
      } else {
        if (j.vids[i] === undefined) j.vids[i] = await uploadVideo(it.blob, j.t, (p) => { prog[i] = Math.round(p * 0.9); sync(); });
        prog[i] = 90; sync();
        if (state) { state = { ...state, phase: 'processing' }; emit(); }
        await waitVideoReady(j.vids[i]!, j.t);
      }
      j.ready[i] = true; prog[i] = 100; sync();
    }));
    if (state) { state = { ...state, phase: 'saving', pct: 100 }; emit(); }
    let res: Response;
    if (j.kind === 'story') {
      const it = j.items[0];
      const body: Record<string, unknown> = { caption: j.caption };
      if (it.kind === 'video') body.videoId = j.vids[0]; else body.imageUrl = j.urls[0];
      res = await fetch('/api/stories', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(body) });
    } else {
      const media = j.items.map((it, i) => (it.kind === 'video' ? { type: 'video', id: j.vids[i] } : { type: 'image', url: j.urls[i] }));
      res = await fetch('/api/posts', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ content: j.caption, media, requestId: j.requestId }) });
    }
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || j.t('feed.errors.publish'));
    state = { ...state!, status: 'done', pct: 100 };
    job = null;
    emit();
  } catch (e: any) {
    state = { ...state!, status: 'failed', error: String(e?.message || j.t('feed.composer.uploadFailed')) };
    emit();
  }
}

/** Починає публікацію у фоні. false — вже йде інша. */
export function startPublish(items: PubItem[], caption: string, kind: PubKind, t: T): boolean {
  if (publishRunning() || !items.length) return false;
  const hasImage = items.some((i) => i.kind === 'image');
  job = { items, caption: caption.trim(), kind, requestId: newId(), urls: [], vids: [], ready: items.map(() => false), t };
  state = { kind, status: 'running', phase: 'upload', pct: 0, go: kind === 'story' ? '/feed' : hasImage || items.length > 1 ? '/feed' : '/video' };
  emit();
  void run();
  return true;
}

export function retryPublish() { if (job && state?.status === 'failed') void run(); }
export function dismissPublish() { if (state?.status !== 'running') { job = null; state = null; emit(); } }
