'use client';

import { memo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { BadgeCheck, ThumbsUp, MessageCircle, Bookmark, Share2, MoreHorizontal, Pencil, Trash2, X, UserPlus, UserCheck, Repeat2, Link2, Lock, Unlock } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ReportButton } from '@/components/ui/ReportButton';
import { BlockButton } from './BlockButton';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { FeedVideo } from '@/components/feed/FeedVideo';
import { MediaCarousel } from '@/components/feed/MediaCarousel';
import { cn } from '@/lib/utils';
import { FeedPost, authHeaders, jsonHeaders, timeAgo } from '@/lib/feedClient';
import { PostComments } from './PostComments';
import { RichText } from './RichText';

interface Props {
  post: FeedPost;
  canInteract: boolean;
  canFollow: boolean;
  onChange: (id: number, patch: Partial<FeedPost>) => void;
  onFollowChange: (authorId: number, following: boolean) => void;
  onDeleted: (id: number) => void;
  autoOpenComments?: boolean;
  onBlocked?: (authorId: number) => void;
}

const LONG_TEXT = 280;
const REACTIONS = [
  { key: 'like', emoji: '👍' },
  { key: 'love', emoji: '❤️' },
  { key: 'laugh', emoji: '😂' },
  { key: 'wow', emoji: '😮' },
  { key: 'sad', emoji: '😢' },
];

function PostCardImpl({ post, canInteract, canFollow, onChange, onFollowChange, onDeleted, autoOpenComments = false, onBlocked }: Props) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(autoOpenComments);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [likeBusy, setLikeBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [repostText, setRepostText] = useState('');
  const [repostBusy, setRepostBusy] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  const { author, viewer } = post;
  const isLong = post.content.length > LONG_TEXT;
  const text = isLong && !expanded ? `${post.content.slice(0, LONG_TEXT).trimEnd()}…` : post.content;

  const toggleSave = async () => {
    if (saveBusy) return;
    setSaveBusy(true);
    const was = !!viewer.saved;
    onChange(post.id, { viewer: { ...viewer, saved: !was } });
    try {
      const res = await fetch(`/api/posts/${post.id}/save`, { method: was ? 'DELETE' : 'POST', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
      toast.success(was ? t('feed.post.unsavedToast') : t('feed.post.savedToast'));
    } catch {
      onChange(post.id, { viewer });
      toast.error(t('feed.toast.actionFailed'));
    } finally {
      setSaveBusy(false);
    }
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/feed/${post.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: author.name, url }); return; }
      await navigator.clipboard.writeText(url);
      toast.success(t('feed.post.linkCopied'));
    } catch { /* користувач скасував */ }
  };

  const react = async (reaction: string | null) => {
    if (!canInteract || likeBusy) return;
    setLikeBusy(true);
    setPickerOpen(false);
    const wasLiked = viewer.liked;
    const willLike = reaction !== null;
    onChange(post.id, {
      viewer: { ...viewer, liked: willLike, reaction },
      likesCount: Math.max(0, post.likesCount + (wasLiked === willLike ? 0 : willLike ? 1 : -1)),
    });
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: willLike ? 'POST' : 'DELETE', credentials: 'include', headers: willLike ? jsonHeaders() : authHeaders(), body: willLike ? JSON.stringify({ reaction }) : undefined });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      onChange(post.id, { viewer: { ...viewer, liked: data.liked, reaction: data.reaction ?? null }, likesCount: data.likesCount });
    } catch {
      onChange(post.id, { viewer, likesCount: post.likesCount });
      toast.error(t('feed.toast.actionFailed'));
    } finally {
      setLikeBusy(false);
    }
  };

  const toggleLike = () => react(viewer.liked ? null : 'like');
  const startHold = () => { held.current = false; holdTimer.current = setTimeout(() => { held.current = true; setPickerOpen(true); }, 450); };
  const endHold = () => { if (holdTimer.current) clearTimeout(holdTimer.current); };

  const doRepost = async () => {
    if (repostBusy) return;
    setRepostBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/repost`, { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ content: repostText }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      onChange(post.id, { repostsCount: (post.repostsCount ?? 0) + 1 });
      toast.success(t('feed.post.reposted'));
      setShareOpen(false);
      setRepostText('');
    } catch (e: any) {
      toast.error(e?.message || t('feed.toast.actionFailed'));
    } finally {
      setRepostBusy(false);
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

  const startEdit = () => {
    setDraft(post.content);
    setEditing(true);
    setMenuOpen(false);
  };

  const saveEdit = async () => {
    const content = draft.trim();
    if (saving || (!content && post.images.length === 0 && !post.video)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'PATCH', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ content }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      onChange(post.id, { content: data.post.content, edited: data.post.edited });
      setEditing(false);
      toast.success(t('feed.toast.saved'));
    } catch (e: any) {
      toast.error(e?.message || t('feed.toast.actionFailed'));
    } finally {
      setSaving(false);
    }
  };

  const togglePrivate = async () => {
    const next = !post.isPrivate;
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'PATCH', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ isPrivate: next }) });
      if (!res.ok) throw new Error();
      onChange(post.id, { isPrivate: next });
      toast.success(next ? t('feed.toast.madePrivate') : t('feed.toast.madePublic'));
    } catch {
      toast.error(t('feed.toast.actionFailed'));
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

  // Кілька елементів (фото й відео разом) — карусель; одне фото чи одне відео показуємо як раніше
  const mixed = !post.repostOf && (post.media?.length ?? 0) > 1 ? post.media! : null;
  const imgs = mixed ? [] : post.images;
  const gridClass = imgs.length === 1 ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <article className="bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.12)]">
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
            {[author.city, timeAgo(post.createdAt, locale, t('feed.post.justNow')), post.edited ? t('feed.post.edited') : null].filter(Boolean).join(' · ')}
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

        <div className="relative shrink-0">
          <button type="button" onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false); }} aria-label={t('feed.post.menu')} aria-expanded={menuOpen} className="p-2 -mr-2 rounded-full text-neutral-500 hover:bg-neutral-100">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {menuOpen && (
            <>
              <button type="button" aria-label={t('feed.post.menuClose')} className="fixed inset-0 z-[5] cursor-default" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} />
              <div className="absolute right-0 mt-1 w-56 rounded-xl bg-white shadow-lg border border-neutral-200 z-10 p-1">
                {viewer.isOwn ? (
                  confirmDelete ? (
                    <div className="p-2 space-y-2">
                      <p className="text-sm text-neutral-800">{t('feed.post.deleteConfirm')}</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={doDelete} className="flex-1 rounded-lg bg-red-600 text-white text-sm py-1.5">{t('feed.post.delete')}</button>
                        <button type="button" onClick={() => { setConfirmDelete(false); setMenuOpen(false); }} className="flex-1 rounded-lg bg-neutral-100 text-sm py-1.5">{t('feed.post.deleteCancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button type="button" onClick={startEdit} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-800 rounded-lg hover:bg-neutral-50">
                        <Pencil className="w-4 h-4" /> {t('feed.post.edit')}
                      </button>
                      <button type="button" onClick={togglePrivate} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-800 rounded-lg hover:bg-neutral-50">
                        {post.isPrivate ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />} {post.isPrivate ? t('feed.post.makePublic') : t('feed.post.makePrivate')}
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(true)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" /> {t('feed.post.delete')}
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <ReportButton
                      reportedUserId={author.id}
                      contentType="post"
                      contentId={post.id}
                      label={t('feed.post.report')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-800 rounded-lg hover:bg-neutral-50"
                    />
                    <div className="px-3 py-2">
                      <BlockButton
                        userId={author.id}
                        className="w-full flex items-center gap-2 text-sm text-red-600"
                        onBlocked={() => { setMenuOpen(false); onBlocked?.(author.id); }}
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Текст */}
      {editing ? (
        <div className="px-4 pt-3 space-y-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={4}
            className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2 text-base md:text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="rounded-full px-4 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100">{t('feed.composer.cancel')}</button>
            <button type="button" onClick={saveEdit} disabled={saving || (!draft.trim() && post.images.length === 0 && !post.video)} className="rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-1.5 disabled:opacity-40">
              {saving ? t('feed.post.saving') : t('feed.post.save')}
            </button>
          </div>
        </div>
      ) : post.content && (
        <div className="px-4 pt-3">
          <p className="text-[15px] leading-relaxed text-neutral-800 whitespace-pre-wrap break-words"><RichText text={text} /></p>
          {isLong && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-sm font-medium text-accent-600">
              {expanded ? t('feed.post.showLess') : t('feed.post.showMore')}
            </button>
          )}
        </div>
      )}

      {/* Фото */}
      {post.repostOf && (
        <Link href={`/feed/${post.repostOf.id}`} className="mx-4 mt-3 block rounded-xl border border-neutral-200 overflow-hidden hover:bg-neutral-50">
          <div className="flex items-center gap-2 px-3 pt-3">
            <UserAvatar src={post.repostOf.author.avatarUrl} alt={post.repostOf.author.name} fallbackName={post.repostOf.author.name} className="w-7 h-7 rounded-full" />
            <span className="text-sm font-semibold text-neutral-900 truncate">{post.repostOf.author.name}</span>
            {post.repostOf.author.isVerified && <BadgeCheck className="w-4 h-4 text-accent-500 shrink-0" aria-hidden />}
          </div>
          {post.repostOf.content && <p className="px-3 pt-2 text-sm text-neutral-800 line-clamp-4 whitespace-pre-wrap break-words">{post.repostOf.content}</p>}
          {post.repostOf.video ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.repostOf.video.posterUrl || ''} alt="" className="mt-2 w-full max-h-72 object-cover bg-black" />
          ) : post.repostOf.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.repostOf.images[0].url} alt="" loading="lazy" className="mt-2 w-full max-h-72 object-cover" />
          ) : <div className="h-3" />}
        </Link>
      )}
      {post.repostUnavailable && <p className="mx-4 mt-3 rounded-xl bg-neutral-100 px-3 py-3 text-sm text-neutral-500">{t('feed.post.repostUnavailable')}</p>}
      {mixed && <MediaCarousel media={mixed} onOpenImage={setLightbox} />}
      {!mixed && post.video && (
        <div className="mt-3 bg-black">
          <FeedVideo src={post.video.url} poster={post.video.posterUrl} />
        </div>
      )}
      {imgs.length > 0 && (
        <div className={cn('grid gap-0.5 mt-3 overflow-hidden', gridClass)}>
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

      {/* Лічильники */}
      {(post.likesCount > 0 || post.commentsCount > 0) && (
        <div className="flex items-center justify-between px-4 pt-3 text-[13px] text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            {post.likesCount > 0 && (
              <>
                <span className="h-[18px] w-[18px] rounded-full bg-primary-500 text-white flex items-center justify-center"><ThumbsUp className="w-[11px] h-[11px] fill-current" /></span>
                {post.likesCount}
              </>
            )}
          </span>
          {post.commentsCount > 0 && (
            <button type="button" onClick={() => setShowComments((v) => !v)} className="hover:underline">
              {t('feed.post.commentsLabel', { count: post.commentsCount })}
            </button>
          )}
        </div>
      )}

      {/* Дії */}
      <div className="mx-4 mt-2 border-t border-neutral-200 grid grid-cols-[1fr_1fr_1fr_auto] gap-1 py-1">
        <div className="relative">
        {pickerOpen && (
          <>
            <button type="button" aria-label={t('feed.post.menuClose')} className="fixed inset-0 z-[5] cursor-default" onClick={() => setPickerOpen(false)} />
            <div className="absolute bottom-full left-0 mb-1 z-10 flex gap-1 rounded-full bg-white shadow-lg border border-neutral-200 px-2 py-1">
              {REACTIONS.map((r) => (
                <button key={r.key} type="button" onClick={() => react(r.key)} aria-label={t(`feed.reactions.${r.key}`)} className="text-2xl hover:scale-125 transition-transform px-0.5">{r.emoji}</button>
              ))}
            </div>
          </>
        )}
        <button
          type="button"
          onClick={() => { if (held.current) { held.current = false; return; } toggleLike(); }}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onContextMenu={(e) => { e.preventDefault(); if (canInteract) setPickerOpen(true); }}
          disabled={!canInteract}
          aria-pressed={viewer.liked}
          aria-label={viewer.liked ? t('feed.post.unlike') : t('feed.post.like')}
          className={cn('inline-flex items-center justify-center gap-2 py-2 rounded-md text-[14px] font-semibold transition hover:bg-neutral-100 active:scale-95 disabled:opacity-60', viewer.liked ? 'text-primary-600' : 'text-neutral-600')}
        >
          {viewer.liked && viewer.reaction && viewer.reaction !== 'like'
            ? <span className="text-xl leading-none">{REACTIONS.find((r) => r.key === viewer.reaction)?.emoji}</span>
            : <ThumbsUp className={cn('w-5 h-5', viewer.liked && 'fill-current')} />}
          <span className="truncate">{viewer.liked && viewer.reaction && viewer.reaction !== 'like' ? t(`feed.reactions.${viewer.reaction}`) : t('feed.post.likeAction')}</span>
        </button>
        </div>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          aria-label={t('feed.post.comments')}
          className={cn('inline-flex items-center justify-center gap-2 py-2 rounded-md text-[14px] font-semibold transition hover:bg-neutral-100 active:scale-95', showComments ? 'text-primary-600' : 'text-neutral-600')}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="truncate">{t('feed.post.commentAction')}</span>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShareOpen((v) => !v)}
            aria-expanded={shareOpen}
            className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-md text-[14px] font-semibold text-neutral-600 transition hover:bg-neutral-100 active:scale-95"
          >
            <Share2 className="w-5 h-5" />
            <span className="truncate">{t('feed.post.shareAction')}{(post.repostsCount ?? 0) > 0 ? ` · ${post.repostsCount}` : ''}</span>
          </button>
          {shareOpen && (
            <>
              <button type="button" aria-label={t('feed.post.menuClose')} className="fixed inset-0 z-[5] cursor-default" onClick={() => setShareOpen(false)} />
              <div className="absolute bottom-full right-0 mb-1 z-10 w-72 rounded-xl bg-white shadow-lg border border-neutral-200 p-3 space-y-2">
                {canInteract && (
                  <>
                    <textarea value={repostText} onChange={(e) => setRepostText(e.target.value)} maxLength={500} rows={2} placeholder={t('feed.post.repostPlaceholder')} className="w-full resize-none rounded-lg border border-neutral-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                    <button type="button" onClick={doRepost} disabled={repostBusy} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold py-2 disabled:opacity-60">
                      <Repeat2 className="w-4 h-4" /> {t('feed.post.repost')}
                    </button>
                  </>
                )}
                <button type="button" onClick={() => { setShareOpen(false); sharePost(); }} className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 text-neutral-700 text-sm font-semibold py-2 hover:bg-neutral-50">
                  <Link2 className="w-4 h-4" /> {t('feed.post.copyLink')}
                </button>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={toggleSave}
          aria-pressed={!!viewer.saved}
          aria-label={viewer.saved ? t('feed.post.unsave') : t('feed.post.save')}
          className={cn('inline-flex items-center justify-center px-3 py-2 rounded-md transition hover:bg-neutral-100 active:scale-95', viewer.saved ? 'text-primary-600' : 'text-neutral-600')}
        >
          <Bookmark className={cn('w-5 h-5', viewer.saved && 'fill-current')} />
        </button>
      </div>

      {showComments && (
        <PostComments
          postId={post.id}
          canComment={canInteract}
          onCountChange={(delta) => onChange(post.id, { commentsCount: Math.max(0, post.commentsCount + delta) })}
        />
      )}

      {lightbox && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-2 pt-[calc(0.5rem+var(--safe-area-inset-top,0px))] pb-[calc(0.5rem+var(--safe-area-inset-bottom,0px))]" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          <button type="button" aria-label={t('feed.post.closePhoto')} className="absolute right-3 top-[calc(0.75rem+var(--safe-area-inset-top,0px))] p-2 rounded-full bg-white/15 text-white">
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      , document.body)}
    </article>
  );
}

export const PostCard = memo(PostCardImpl);
