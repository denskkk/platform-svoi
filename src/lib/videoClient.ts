/**
 * Клієнтські хелпери для відео/фото з телефона: однаковий вантаж, прогрес, очікування обробки, зрозумілі помилки.
 * Використовується в PostComposer, StoriesBar і студії створення (Creator).
 */
import { authHeaders } from '@/lib/feedClient';

/** Ліміти узгоджені з VIDEO_LIMITS на сервері та nginx (client_max_body_size для /api/videos/upload). */
export const VIDEO_MAX_MB = 150;
export const VIDEO_MAX_BYTES = VIDEO_MAX_MB * 1024 * 1024;

type T = (key: string, params?: Record<string, string | number>) => string;

/** Деякі Android-браузери віддають порожній file.type — визначаємо за розширенням. */
export function videoMimeOf(file: Blob & { name?: string }): string {
  const t = (file.type || '').split(';')[0].toLowerCase();
  if (t === 'video/mp4' || t === 'video/quicktime' || t === 'video/webm') return t;
  const n = (file.name || '').toLowerCase();
  if (n.endsWith('.mov') || n.endsWith('.qt')) return 'video/quicktime';
  if (n.endsWith('.webm')) return 'video/webm';
  return 'video/mp4'; // 3gp, m4v, mkv та інше з камери — ffmpeg на сервері розбере вміст
}

/** Вантаж відео сирим тілом із відсотками прогресу. Повертає id відео в черзі обробки. */
export function uploadVideo(file: Blob & { name?: string }, t: T, onProgress?: (percent: number) => void): Promise<number> {
  return new Promise((resolve, reject) => {
    if (file.size > VIDEO_MAX_BYTES) return reject(new Error(t('feed.composer.videoTooLarge', { max: VIDEO_MAX_MB })));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/videos/upload');
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', videoMimeOf(file));
    for (const [k, v] of Object.entries(authHeaders())) xhr.setRequestHeader(k, v);
    xhr.timeout = 10 * 60_000;
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onerror = () => reject(new Error(t('feed.composer.uploadNetwork')));
    xhr.ontimeout = () => reject(new Error(t('feed.composer.uploadNetwork')));
    xhr.onload = () => {
      let d: any = {};
      try { d = JSON.parse(xhr.responseText); } catch { /* не JSON — відповідь проксі */ }
      if (xhr.status === 413) return reject(new Error(t('feed.composer.videoTooLarge', { max: VIDEO_MAX_MB })));
      if (xhr.status >= 200 && xhr.status < 300 && d.video?.id) return resolve(d.video.id as number);
      reject(new Error(d.error || t('feed.composer.videoUploadFailed')));
    };
    xhr.send(file);
  });
}

/** Чекає, поки сервер обробить відео (до ~6 хв). Кидає помилку з конкретною причиною. */
export async function waitVideoReady(id: number, t: T): Promise<number> {
  for (let i = 0; i < 180; i++) {
    await new Promise((r) => setTimeout(r, i < 5 ? 1500 : 2500));
    let d: any = {};
    let ok = false;
    try {
      const res = await fetch(`/api/videos/${id}`, { credentials: 'include', headers: authHeaders() });
      ok = res.ok;
      d = await res.json().catch(() => ({}));
    } catch { continue; } // коротка втрата мережі — пробуємо ще
    if (d.video?.status === 'ready') return id;
    if (d.video?.status === 'failed') {
      const code = String(d.video.error || '');
      const known = ['unreadable', 'encode_failed', 'ffmpeg_missing'];
      throw new Error(t(known.includes(code) ? `feed.composer.videoErr.${code}` : 'feed.composer.videoFailed'));
    }
    if (!ok && d.error) throw new Error(d.error);
  }
  throw new Error(t('feed.composer.videoSlow'));
}

/** Стискає фото з телефона (довга сторона до 1600 px, JPEG): 8–12 МБ → <1 МБ, швидко вантажиться навіть по мобільному інтернету. */
export async function shrinkImage(file: File): Promise<File> {
  try {
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 1.2 * 1024 * 1024) return file;
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const out: Blob | null = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85));
    if (!out || out.size >= file.size) return file;
    return new File([out], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch { return file; } // HEIC та інше, що браузер не читає — вантажимо як є
}
