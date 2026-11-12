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
  images: { orderBy: { position: 'asc' as const }, select: { id: true, url: true } },
} as const;

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
  images: { id: number; url: string }[];
};

export function serializePost(post: PostRow, viewer: { liked: Set<number>; following: Set<number>; saved?: Set<number>; userId: number }) {
  const { author } = post;
  return {
    id: post.id,
    content: post.content,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    createdAt: post.createdAt.toISOString(),
    edited: post.updatedAt.getTime() - post.createdAt.getTime() > 60_000,
    images: post.images,
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
      ? prisma.postLike.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } })
      : Promise.resolve([] as { postId: number }[]),
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
    liked: new Set(likes.map((l: any) => l.postId)),
    following: new Set(follows.map((f: any) => f.followingId)),
    saved: new Set(saved),
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
