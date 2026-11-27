/**
 * Відео допису: ліміти, шляхи і фонова обробка.
 *
 * Розрахунок на слабкий сервер (1 CPU): завантаження йде потоком прямо на диск (без буфера в пам’яті),
 * а перекодування виконується ОДНИМ процесом ffmpeg за раз із найнижчим пріоритетом (nice 19).
 * Результат — 720p H.264 + постер; оригінал після обробки видаляється.
 * Файли лежать у <UPLOADS_DIR>/videos і віддаються як /uploads/videos/<file> (nginx може віддавати їх напряму).
 */

import { spawn } from 'child_process';
import { mkdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

export const VIDEO_LIMITS = {
  maxBytes: 150 * 1024 * 1024, // відео з телефона: хвилина 1080p ≈ 60–130 МБ
  maxSeconds: 60,
  maxLongSide: 1280,
  uploadsPerDay: 10,
  mimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'] as string[],
};

const EXT_BY_MIME: Record<string, string> = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' };
export const extForMime = (mime: string) => EXT_BY_MIME[mime] || null;

export const uploadsRoot = () => process.env.UPLOADS_DIR || join(process.cwd(), 'public', 'uploads');
export const videosDir = () => join(uploadsRoot(), 'videos');
export const rawDir = () => join(uploadsRoot(), 'videos-raw'); // не віддається назовні

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe';
const NICE = process.platform === 'win32' ? null : 'nice';

function run(cmd: string, args: string[], timeoutMs: number): Promise<{ code: number | null; out: string }> {
  return new Promise((resolve, reject) => {
    const [bin, binArgs] = NICE ? [NICE, ['-n', '19', cmd, ...args]] : [cmd, args];
    const child = spawn(bin, binArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { if (out.length < 4000) out += d; });
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, out }); });
  });
}

async function processOne(video: { id: number; rawName: string | null }): Promise<void> {
  const fail = async (error: string) => {
    await prisma.postVideo.update({ where: { id: video.id }, data: { status: 'failed', error: error.slice(0, 120) } });
    if (video.rawName) await unlink(join(rawDir(), video.rawName)).catch(() => undefined);
  };
  if (!video.rawName) return fail('no_source');
  const input = join(rawDir(), video.rawName);
  await mkdir(videosDir(), { recursive: true });
  const outName = `v${video.id}.mp4`;
  const posterName = `v${video.id}.jpg`;
  const output = join(videosDir(), outName);

  try {
    const probe = await run(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', input], 30_000);
    const duration = Number(probe.out.trim().split('\n')[0]);
    if (probe.code !== 0 || !Number.isFinite(duration) || duration <= 0) return fail('unreadable');
    // задовге відео не відхиляємо: нижче ffmpeg обріже його до maxSeconds (-t)

    const L = VIDEO_LIMITS.maxLongSide;
    const scale = `scale='if(gt(iw,ih),min(${L},iw),-2)':'if(gt(iw,ih),-2,min(${L},ih))'`;
    const enc = await run(FFMPEG, ['-y', '-i', input, '-t', String(VIDEO_LIMITS.maxSeconds), '-vf', scale, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-g', '30', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-threads', '1', output], 15 * 60_000);
    if (enc.code !== 0) { await unlink(output).catch(() => undefined); return fail('encode_failed'); }

    const poster = await run(FFMPEG, ['-y', '-ss', String(Math.min(1, duration / 2)), '-i', output, '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '4', join(videosDir(), posterName)], 60_000);
    const info = await stat(output);
    await prisma.postVideo.update({
      where: { id: video.id },
      data: { status: 'ready', url: `/uploads/videos/${outName}`, posterUrl: poster.code === 0 ? `/uploads/videos/${posterName}` : null, durationSec: Math.round(Math.min(duration, VIDEO_LIMITS.maxSeconds)), sizeBytes: info.size, error: null },
    });
    await unlink(input).catch(() => undefined);
  } catch (e: any) {
    console.error('Video processing error:', e);
    await fail(e?.code === 'ENOENT' ? 'ffmpeg_missing' : 'error');
  }
}

let running = false;

/** Запускає чергу обробки (по одному відео). Безпечно викликати багато разів. */
export function kickVideoWorker(): void {
  if (running) return;
  running = true;
  (async () => {
    try {
      // відео, що «зависли» в обробці (наприклад, після перезапуску сервера), повертаємо в чергу
      await prisma.postVideo.updateMany({ where: { status: 'processing', updatedAt: { lt: new Date(Date.now() - 20 * 60_000) } }, data: { status: 'queued' } });
      for (;;) {
        const next = await prisma.postVideo.findFirst({ where: { status: 'queued' }, orderBy: { id: 'asc' }, select: { id: true, rawName: true } });
        if (!next) break;
        const claimed = await prisma.postVideo.updateMany({ where: { id: next.id, status: 'queued' }, data: { status: 'processing' } });
        if (claimed.count === 0) continue;
        await processOne(next);
      }
      // прибирання: непідключені до допису відео старші за добу
      const stale = await prisma.postVideo.findMany({ where: { postId: null, story: null, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } }, select: { id: true, rawName: true, url: true, posterUrl: true }, take: 50 });
      for (const v of stale) {
        await removeVideoFiles(v);
        await prisma.postVideo.delete({ where: { id: v.id } }).catch(() => undefined);
      }
    } catch (e) {
      console.error('Video worker error:', e);
    } finally {
      running = false;
    }
  })();
}

export async function removeVideoFiles(v: { rawName?: string | null; url?: string | null; posterUrl?: string | null }) {
  const del = (p: string) => unlink(p).catch(() => undefined);
  if (v.rawName) await del(join(rawDir(), v.rawName));
  for (const u of [v.url, v.posterUrl]) {
    const name = typeof u === 'string' ? u.replace('/uploads/videos/', '') : '';
    if (/^v\d+\.(mp4|jpg)$/.test(name)) await del(join(videosDir(), name));
  }
}
