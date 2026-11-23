/**
 * Спільна логіка стрічки: ліміти, вибірка автора, серіалізація допису.
 */

import { unlink } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

export const FEED_LIMITS = {
  postMaxLength: 2000,
  commentMaxLength: 1000,
  maxImages: 6,
  maxMedia: 10, // фото + відео разом в одному дописі
  maxVideos: 4,
  pageSize: 10,
  maxPageSize: 30,
} as const;

export const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  city: true,
  profession: true,
  isVerified: true,
  accountType: true,
  businessInfo: { select: { companyName: true, logoUrl: true } },
} as const;

export const postInclude = {
  author: { select: authorSelect },
  images: { orderBy: { position: 'asc' as const }, select: { id: true, url: true, position: true } },
  videos: { orderBy: [{ position: 'asc' as const }, { id: 'asc' as const }], select: { id: true, status: true, url: true, posterUrl: true, durationSec: true, position: true } },
  repostOf: {
    select: {
      id: true, content: true, isHidden: true,
      author: { select: authorSelect },
      images: { orderBy: { position: 'asc' as const }, take: 4, select: { id: true, url: true, position: true } },
      videos: { orderBy: [{ position: 'asc' as const }, { id: 'asc' as const }], select: { id: true, status: true, url: true, posterUrl: true, durationSec: true, position: true } },
    },
  },
} as const;

type RawVideo = { id: number; status: string; url: string | null; posterUrl: string | null; durationSec: number | null; position?: number };

export type MediaItem =
  | { type: 'image'; id: number; url: string }
  | { type: 'video'; id: number; url: string; posterUrl: string | null; durationSec: number | null };

/**
 * Єдина карусель допису: фото й відео в порядку, який вибрав автор (спільна нумерація position).
 * У старих дописів (одне відео + фото) позиції збігаються — відео йде першим, як і показувалось раніше.
 */
export function buildMedia(images: { id: number; url: string; position?: number }[], videos: RawVideo[] | undefined): MediaItem[] {
  const out: { pos: number; kind: number; item: MediaItem }[] = [];
  images.forEach((im, i) => out.push({ pos: im.position ?? i, kind: 1, item: { type: 'image', id: im.id, url: im.url } }));
  (videos ?? []).forEach((v) => {
    if (v.status === 'ready' && v.url) out.push({ pos: v.position ?? 0, kind: 0, item: { type: 'video', id: v.id, url: v.url, posterUrl: v.posterUrl, durationSec: v.durationSec } });
  });
  out.sort((a, b) => a.pos - b.pos || a.kind - b.kind);
  return out.map((o) => o.item);
}

type PostRow = {
  id: number;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    city: string | null;
    profession: string | null;
    isVerified: boolean;
    accountType: string;
    businessInfo: { companyName: string | null; logoUrl: string | null } | null;
  };
  images: { id: number; url: string; position?: number }[];
  videos?: RawVideo[];
  repostsCount?: number;
  repostOfId?: number | null;
  repostOf?: { id: number; content: string; isHidden: boolean; author: PostRow['author']; images: { id: number; url: string; position?: number }[]; videos?: RawVideo[] } | null;
};

function firstVideo(videos: RawVideo[] | undefined) {
  const v = (videos ?? []).find((x) => x.status === 'ready' && x.url);
  return v ? { id: v.id, url: v.url as string, posterUrl: v.posterUrl, durationSec: v.durationSec } : null;
}

export function serializePost(post: PostRow, viewer: { liked: Set<number>; following: Set<number>; saved?: Set<number>; reactions?: Map<number, string>; userId: number }) {
  const { author } = post;
  const orig = post.repostOf && !post.repostOf.isHidden && !(post.repostOf as any).isPrivate ? post.repostOf : null;
  return {
    id: post.id,
    content: post.content,
    isPrivate: !!(post as any).isPrivate,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    repostsCount: post.repostsCount ?? 0,
    repostOf: orig
      ? {
          id: orig.id,
          content: orig.content,
          images: orig.images.map((im) => ({ id: im.id, url: im.url })),
          video: firstVideo(orig.videos),
          author: { id: orig.author.id, name: orig.author.businessInfo?.companyName || `${orig.author.firstName} ${orig.author.lastName}`.trim(), avatarUrl: orig.author.businessInfo?.logoUrl || orig.author.avatarUrl, isVerified: orig.author.isVerified },
        }
      : null,
    repostUnavailable: !!post.repostOfId && !orig,
    createdAt: post.createdAt.toISOString(),
    edited: post.updatedAt.getTime() - post.createdAt.getTime() > 60_000,
    images: post.images.map((im) => ({ id: im.id, url: im.url })),
    video: firstVideo(post.videos), // перше відео — для рілсів, прев'ю й сумісності зі старими клієнтами
    media: buildMedia(post.images, post.videos),
    author: {
      id: author.id,
      name: author.businessInfo?.companyName || `${author.firstName} ${author.lastName}`.trim(),
      avatarUrl: author.businessInfo?.logoUrl || author.avatarUrl,
      city: author.city,
      profession: author.profession,
      isVerified: author.isVerified,
      accountType: author.accountType,
    },
    viewer: {
      liked: viewer.liked.has(post.id),
      reaction: viewer.liked.has(post.id) ? viewer.reactions?.get(post.id) ?? 'like' : null,
      isOwn: author.id === viewer.userId,
      following: viewer.following.has(author.id),
      saved: viewer.saved?.has(post.id) ?? false,
    },
  };
}

/** Які з переданих дописів лайкнув користувач і на яких авторів він підписаний. */
export async function loadViewerState(userId: number, postIds: number[], authorIds: number[]) {
  const [likes, follows] = await Promise.all([
    postIds.length
      ? prisma.postLike.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true, reaction: true } })
      : Promise.resolve([] as { postId: number; reaction?: string }[]),
    authorIds.length
      ? prisma.follow.findMany({ where: { followerId: userId, followingId: { in: authorIds } }, select: { followingId: true } })
      : Promise.resolve([] as { followingId: number }[]),
  ]);
  // Закладки: якщо таблиці ще немає — стрічка працює без них
  let saved: number[] = [];
  if (postIds.length) {
    try {
      saved = (await prisma.savedPost.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } })).map((r: any) => r.postId);
    } catch {
      saved = [];
    }
  }
  return {
    userId,
    liked: new Set<number>((likes as { postId: number }[]).map((l) => l.postId)),
    reactions: new Map<number, string>((likes as { postId: number; reaction?: string }[]).map((l) => [l.postId, l.reaction || 'like'] as [number, string])),
    following: new Set<number>((follows as { followingId: number }[]).map((f) => f.followingId)),
    saved: new Set<number>(saved),
  };
}

export function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Фото допису можуть бути тільки з наших завантажень (захист від сторонніх URL). */
export function isOwnPostImage(url: unknown): url is string {
  return typeof url === 'string' && /^\/uploads\/posts\/[A-Za-z0-9._-]+\.(webp|jpg)$/.test(url);
}

/** Видаляє файли фото допису (WebP + JPEG-копію). Помилки ігноруються — це лише прибирання. */
export async function removePostImageFiles(urls: string[]) {
  const root = process.env.UPLOADS_DIR || join(process.cwd(), 'public', 'uploads');
  await Promise.all(
    urls.filter(isOwnPostImage).flatMap((url) => {
      const name = url.replace('/uploads/posts/', '');
      const base = name.replace(/\.(webp|jpg)$/, '');
      return [`${base}.webp`, `${base}.jpg`].map((f) => unlink(join(root, 'posts', f)).catch(() => undefined));
    })
  );
}
