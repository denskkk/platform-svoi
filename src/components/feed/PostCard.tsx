'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Heart, MessageCircle, MoreHorizontal, Trash2, X, UserPlus, UserCheck } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { FeedPost, authHeaders, jsonHeaders, timeAgo } from '@/lib/feedClient';
import { PostComments } from './PostComments';

interface Props {
  post: FeedPost;
  canInteract: boolean;
  canFollow: boolean;
  onChange: (id: number, patch: Partial<FeedPost>) => void;
  onFollowChange: (authorId: number, following: boolean) => void;
  onDeleted: (id: number) => void;
}

const LONG_TEXT = 280;

function PostCardImpl({ post, canInteract, canFollow, onChange, onFollowChange, onDeleted }: Props) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [likeBusy, setLikeBusy] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const { author, viewer } = post;
  const isLong = post.content.length > LONG_TEXT;
  const text = isLong && !expanded ? `${post.content.slice(0, LONG_TEXT).trimEnd()}…` : post.content;

  const toggleLike = async () => {
    if (!canInteract || likeBusy) return;
    setLikeBusy(true);
    const wasLiked = viewer.liked;
    onChange(post.id, {
      viewer: { ...viewer, liked: !wasLiked },
      likesCount: Math.max(0, post.likesCount + (wasLiked ? -1 : 1)),
    });
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: wasLiked ? 'DELETE' : 'POST', credentials: 'include', headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      onChange(post.id, { viewer: { ...viewer, liked: data.liked }, likesCount: data.likesCount });
    } catch {
      onChange(post.id, { viewer, likesCount: post.likesCount });
      toast.error(t('feed.toast.actionFailed'));
    } finally {
      setLikeBusy(false);
    }
  };

  const toggleFollow = async () => {
    if (followBusy) return;
    setFollowBusy(true);
    const next = !viewer.following;
    onFollowChange(author.id, next);
    try {
      const res = await fetch(next ? '/api/follows' : `/api/follows?userId=${author.id}`, {
        method: next ? 'POST' : 'DELETE',
        credentials: 'include',
        headers: next ? jsonHeaders() : authHeaders(),
        body: next ? JSON.stringify({ userId: author.id }) : undefined,
      });
      if (!res.ok) throw new Error();
      toast.success(next ? t('feed.toast.followed') : t('feed.toast.unfollowed'));
    } catch {
      onFollowChange(author.id, !next);
      toast.error(t('feed.toast.actionFailed'));
    } finally {
      setFollowBusy(false);
    }
  };

  const doDelete = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
      onDeleted(post.id);
      toast.success(t('feed.toast.deleted'));
    } catch {
      toast.error(t('feed.toast.actionFailed'));
    } finally {
      setConfirmDelete(false);
      setMenuOpen(false);
    }
  };

  const imgs = post.images;
  const gridClass = imgs.length === 1 ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-neutral-200/70 overflow-hidden">
      {/* Автор */}
      <header className="flex items-center gap-3 px-4 pt-4">
        <Link href={`/profile/${author.id}`} className="shrink-0">
          <UserAvatar src={author.avatarUrl} alt={author.name} fallbackName={author.name} className="w-11 h-11 rounded-full" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${author.id}`} className="flex items-center gap-1 font-semibold text-neutral-900 hover:text-primary-700 min-w-0">
            <span className="truncate">{author.name}</span>
            {author.isVerified && <BadgeCheck className="w-4 h-4 text-accent-500 shrink-0" aria-hidden />}
          </Link>
          <p className="text-xs text-neutral-500 truncate">
            {[author.city, timeAgo(post.createdAt, locale, t('feed.post.justNow'))].filter(Boolean).join(' · ')}
          </p>
        </div>

        {!viewer.isOwn && canFollow && (
          <button
            type="button"
            onClick={toggleFollow}
            disabled={followBusy}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95',
              viewer.following ? 'bg-neutral-100 text-neutral-700' : 'bg-primary-500 text-white hover:bg-primary-600'
            )}
          >
            {viewer.following ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            {viewer.following ? t('feed.post.following') : t('feed.post.follow')}
          </button>
        )}

        {viewer.isOwn && (
          <div className="relative shrink-0">
            <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label={t('feed.post.menu')} className="p-2 -mr-2 rounded-full text-neutral-500 hover:bg-neutral-100">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-xl bg-white shadow-lg border border-neutral-200 z-10 p-1">
                {confirmDelete ? (
                  <div className="p-2 space-y-2">
                    <p className="text-sm text-neutral-800">{t('feed.post.deleteConfirm')}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={doDelete} className="flex-1 rounded-lg bg-red-600 text-white text-sm py-1.5">{t('feed.post.delete')}</button>
                      <button type="button" onClick={() => { setConfirmDelete(false); setMenuOpen(false); }} className="flex-1 rounded-lg bg-neutral-100 text-sm py-1.5">{t('feed.post.deleteCancel')}</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4" /> {t('feed.post.delete')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Текст */}
      {post.content && (
        <div className="px-4 pt-3">
          <p className="text-[15px] leading-relaxed text-neutral-800 whitespace-pre-wrap break-words">{text}</p>
          {isLong && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-sm font-medium text-accent-600">
              {expanded ? t('feed.post.showLess') : t('feed.post.showMore')}
            </button>
          )}
        </div>
      )}

      {/* Фото */}
      {imgs.length > 0 && (
        <div className={cn('grid gap-0.5 mt-3', gridClass)}>
          {imgs.slice(0, 4).map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightbox(img.url)}
              aria-label={t('feed.post.openPhoto')}
              className={cn('relative bg-neutral-100 overflow-hidden', imgs.length === 1 ? 'max-h-[28rem]' : 'aspect-square', imgs.length === 3 && i === 0 && 'row-span-2 aspect-auto')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" loading="lazy" decoding="async" className={cn('w-full object-cover', imgs.length === 1 ? 'max-h-[28rem]' : 'h-full')} />
              {i === 3 && imgs.length > 4 && (
                <span className="absolute inset-0 bg-black/50 text-white text-2xl font-semibold flex items-center justify-center">+{imgs.length - 4}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Дії */}
      <div className="flex items-center gap-1 px-2 py-1.5 mt-1">
        <button
          type="button"
          onClick={toggleLike}
          disabled={!canInteract}
          aria-pressed={viewer.liked}
          aria-label={viewer.liked ? t('feed.post.unlike') : t('feed.post.like')}
          className={cn('inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition active:scale-95 disabled:opacity-60', viewer.liked ? 'text-red-500' : 'text-neutral-600 hover:bg-neutral-100')}
        >
          <Heart className={cn('w-5 h-5', viewer.liked && 'fill-current')} />
          <span>{post.likesCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          aria-label={t('feed.post.comments')}
          className={cn('inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition active:scale-95', showComments ? 'text-accent-600' : 'text-neutral-600 hover:bg-neutral-100')}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.commentsCount}</span>
        </button>
      </div>

      {showComments && (
        <PostComments
          postId={post.id}
          canComment={canInteract}
          onCountChange={(delta) => onChange(post.id, { commentsCount: Math.max(0, post.commentsCount + delta) })}
        />
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-2" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          <button type="button" aria-label={t('feed.post.closePhoto')} className="absolute right-3 top-[calc(0.75rem+var(--safe-area-inset-top,0px))] p-2 rounded-full bg-white/15 text-white">
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </article>
  );
}

export const PostCard = memo(PostCardImpl);
