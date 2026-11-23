'use client';

import { useCallback, useEffect, useState } from 'react';
import { Send, Trash2, X } from 'lucide-react';
import { ReportButton } from '@/components/ui/ReportButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { FeedComment, jsonHeaders, authHeaders, timeAgo } from '@/lib/feedClient';

interface Props {
  postId: number;
  canComment: boolean;
  onCountChange: (delta: number) => void;
}

export function PostComments({ postId, canComment, onCountChange }: Props) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [replies, setReplies] = useState<Record<number, FeedComment[]>>({});
  const [openReplies, setOpenReplies] = useState<Record<number, boolean>>({});

  const load = useCallback(async (after?: number | null) => {
    try {
      const qs = after ? `?cursor=${after}` : '';
      const res = await fetch(`/api/posts/${postId}/comments${qs}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setComments((prev) => (after ? [...prev, ...data.comments] : data.comments));
      setCursor(data.nextCursor ?? null);
    } catch {
      toast.error(t('feed.errors.comments'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId, t, toast]);

  useEffect(() => { load(null); }, [load]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ content, parentId: replyTo?.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      if (replyTo) {
        const rid = replyTo.id;
        setReplies((r) => ({ ...r, [rid]: [...(r[rid] || []), data.comment] }));
        setOpenReplies((o) => ({ ...o, [rid]: true }));
        setComments((list) => list.map((c) => (c.id === rid ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c)));
        setReplyTo(null);
      } else {
        setComments((prev) => [...prev, data.comment]);
      }
      onCountChange(1);
      setText('');
    } catch (e: any) {
      toast.error(e?.message || t('feed.toast.actionFailed'));
    } finally {
      setSending(false);
    }
  };

  const toggleLike = async (c: FeedComment) => {
    const next = !c.liked;
    const patch = (x: FeedComment): FeedComment => (x.id === c.id ? { ...x, liked: next, likesCount: Math.max(0, (x.likesCount || 0) + (next ? 1 : -1)) } : x);
    const revert = (x: FeedComment): FeedComment => (x.id === c.id ? { ...x, liked: c.liked, likesCount: c.likesCount } : x);
    const apply = (fn: (x: FeedComment) => FeedComment) => {
      setComments((list) => list.map(fn));
      setReplies((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.map(fn)])));
    };
    apply(patch);
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${c.id}/like`, { method: next ? 'POST' : 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
    } catch {
      apply(revert);
      toast.error(t('feed.toast.actionFailed'));
    }
  };

  const loadReplies = async (id: number) => {
    setOpenReplies((o) => ({ ...o, [id]: !o[id] }));
    if (replies[id]) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments?parentId=${id}&limit=50`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setReplies((r) => ({ ...r, [id]: data.comments }));
    } catch {
      setOpenReplies((o) => ({ ...o, [id]: false }));
      toast.error(t('feed.errors.comments'));
    }
  };

  const remove = async (c: FeedComment) => {
    const isReply = !!c.parentId;
    const delta = isReply ? 1 : 1 + (c.repliesCount || 0);
    const prevC = comments;
    const prevR = replies;
    if (isReply) {
      const pid = c.parentId as number;
      setReplies((r) => ({ ...r, [pid]: (r[pid] || []).filter((x) => x.id !== c.id) }));
      setComments((list) => list.map((x) => (x.id === pid ? { ...x, repliesCount: Math.max(0, (x.repliesCount || 0) - 1) } : x)));
    } else {
      setComments((list) => list.filter((x) => x.id !== c.id));
    }
    onCountChange(-delta);
    try {
      const res = await fetch(`/api/posts/${postId}/comments?commentId=${c.id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
    } catch {
      setComments(prevC);
      setReplies(prevR);
      onCountChange(delta);
      toast.error(t('feed.toast.actionFailed'));
    }
  };

  const renderItem = (c: FeedComment, isReply: boolean) => (
    <li key={c.id} className="flex gap-2.5">
      <UserAvatar src={c.author.avatarUrl} alt={c.author.name} fallbackName={c.author.name} className={`${isReply ? 'w-7 h-7' : 'w-8 h-8'} rounded-full shrink-0`} />
      <div className="min-w-0 flex-1">
        <div className="relative inline-block max-w-full bg-neutral-100 rounded-2xl px-3 py-2">
          <p className="text-xs font-semibold text-neutral-800 truncate">{c.author.name}</p>
          <p className="text-sm text-neutral-800 whitespace-pre-wrap break-words">{c.content}</p>
          {(c.likesCount || 0) > 0 && (
            <span className="absolute -bottom-2.5 right-1 inline-flex items-center gap-0.5 rounded-full bg-white shadow px-1.5 py-0.5 text-[11px] text-neutral-600">
              <span aria-hidden>👍</span>{c.likesCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 px-2 text-xs font-semibold text-neutral-500">
          {canComment && (
            <button type="button" onClick={() => toggleLike(c)} aria-pressed={!!c.liked} className={c.liked ? 'text-primary-600' : 'hover:underline'}>
              {t('feed.comments.like')}
            </button>
          )}
          {canComment && !isReply && (
            <button type="button" onClick={() => { setReplyTo(c); }} className="hover:underline">{t('feed.comments.reply')}</button>
          )}
          <span className="font-normal">{timeAgo(c.createdAt, locale, t('feed.post.justNow'))}</span>
          {!c.isOwn && canComment && c.author.id ? (
            <ReportButton reportedUserId={c.author.id} contentType="comment" contentId={c.id} label={t('feed.comments.report')} className="font-normal hover:underline" />
          ) : null}
          {c.isOwn && (
            <button type="button" onClick={() => remove(c)} className="inline-flex items-center gap-1 hover:text-red-600" aria-label={t('feed.comments.delete')}>
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {!isReply && (c.repliesCount || 0) > 0 && (
          <button type="button" onClick={() => loadReplies(c.id)} className="mt-1 px-2 text-xs font-semibold text-neutral-600 hover:underline">
            {openReplies[c.id] ? t('feed.comments.hideReplies') : t('feed.comments.showReplies', { count: c.repliesCount || 0 })}
          </button>
        )}
        {!isReply && openReplies[c.id] && (replies[c.id] || []).length > 0 && (
          <ul className="mt-2 space-y-3">{(replies[c.id] || []).map((r) => renderItem(r, true))}</ul>
        )}
      </div>
    </li>
  );

  return (
    <div className="px-4 pb-3 pt-2 space-y-3">
      {loading ? (
        <div className="space-y-2" aria-hidden>
          <div className="h-10 rounded-lg bg-neutral-100 animate-pulse" />
          <div className="h-10 rounded-lg bg-neutral-100 animate-pulse w-4/5" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-2">{t('feed.comments.empty')}</p>
      ) : (
        <ul className="space-y-4">{comments.map((c) => renderItem(c, false))}</ul>
      )}

      {cursor && (
        <button type="button" disabled={loadingMore} onClick={() => { setLoadingMore(true); load(cursor); }} className="text-sm font-medium text-accent-600 hover:underline">
          {t('feed.comments.loadMore')}
        </button>
      )}

      {canComment ? (
        <div className="space-y-1">
          {replyTo && (
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-1 text-xs text-neutral-600">
              <span className="truncate">{t('feed.comments.replyingTo', { name: replyTo.author.name })}</span>
              <button type="button" onClick={() => setReplyTo(null)} aria-label={t('feed.comments.cancelReply')} className="p-1 hover:text-neutral-900"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              rows={1}
              placeholder={replyTo ? t('feed.comments.replyPlaceholder') : t('feed.comments.placeholder')}
              className="flex-1 resize-none rounded-2xl bg-neutral-100 px-3.5 py-2.5 text-base md:text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button type="submit" disabled={!text.trim() || sending} aria-label={t('feed.comments.send')}
              className="h-10 w-10 shrink-0 rounded-full bg-primary-500 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <p className="text-xs text-neutral-500 text-center">{t('feed.comments.viewerNotice')}</p>
      )}
    </div>
  );
}
