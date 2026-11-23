/** Історії: тривалість життя, прибирання протермінованих і серіалізація. */

import { prisma } from '@/lib/prisma';
import { removeVideoFiles } from '@/lib/videos';
import { removePostImageFiles } from '@/lib/feed';

export const STORY_TTL_MS = 24 * 60 * 60 * 1000;
export const STORY_CAPTION_MAX = 200;

let lastPurge = 0;

/** Видаляє історії, термін яких минув (разом із файлами). Не частіше разу на 10 хвилин на процес. */
export async function purgeExpiredStories(): Promise<void> {
  if (Date.now() - lastPurge < 10 * 60_000) return;
  lastPurge = Date.now();
  try {
    const old = await prisma.story.findMany({
      where: { expiresAt: { lt: new Date() } },
      take: 100,
      select: { id: true, mediaType: true, mediaUrl: true, video: { select: { id: true, rawName: true, url: true, posterUrl: true } } },
    });
    for (const s of old) {
      if (s.mediaType === 'video' && s.video) {
        await removeVideoFiles(s.video);
        await prisma.postVideo.delete({ where: { id: s.video.id } }).catch(() => undefined);
      } else if (s.mediaType === 'image') {
        await removePostImageFiles([s.mediaUrl]);
      }
      await prisma.story.delete({ where: { id: s.id } }).catch(() => undefined);
    }
  } catch (e) {
    console.error('Story purge error:', e);
  }
}
