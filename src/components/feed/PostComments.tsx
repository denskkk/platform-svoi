'use client';

import { useCallback, useEffect, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
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
        method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setComments((prev) => [...prev, data.comment]);
      onCountChange(1);
      setText('');
    } catch (e: any) {
      toast.error(e?.message || t('feed.toast.actionFailed'));
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: number) => {
    const prev = comments;
    setComments((list) => list.filter((c) => c.id !== id));
    onCountChange(-1);
    try {
      const res = await fetch(`/api/posts/${postId}/comments?commentId=${id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
    } catch {
      setComments(prev);
      onCountChange(1);
      toast.error(t('feed.toast.actionFailed'));
    }
  };

  return (
    <div className="border-t border-neutral-100 px-4 pb-4 pt-3 space-y-3">
      {loading ? (
        <div className="space-y-2" aria-hidden>
          <div className="h-10 rounded-lg bg-neutral-100 animate-pulse" />
          <div className="h-10 rounded-lg bg-neutral-100 animate-pulse w-4/5" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-2">{t('feed.comments.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <UserAvatar src={c.author.avatarUrl} alt={c.author.name} fallbackName={c.author.name} className="w-8 h-8 rounded-full shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="bg-neutral-50 rounded-2xl rounded-tl-md px-3 py-2">
                  <p className="text-xs font-semibold text-neutral-800 truncate">{c.author.name}</p>
                  <p className="text-sm text-neutral-800 whitespace-pre-wrap break-words">{c.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-0.5 px-2 text-xs text-neutral-500">
                  <span>{timeAgo(c.createdAt, locale, t('feed.post.justNow'))}</span>
                  {c.isOwn && (
                    <button type="button" onClick={() => remove(c.id)} className="inline-flex items-center gap-1 hover:text-red-600" aria-label={t('feed.comments.delete')}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cursor && (
        <button type="button" disabled={loadingMore} onClick={() => { setLoadingMore(true); load(cursor); }} className="text-sm font-medium text-accent-600 hover:underline">
          {t('feed.comments.loadMore')}
        </button>
      )}

      {canComment ? (
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={1}
            placeholder={t('feed.comments.placeholder')}
            className="flex-1 resize-none rounded-2xl border border-neutral-200 bg-white px-3.5 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <button type="submit" disabled={!text.trim() || sending} aria-label={t('feed.comments.send')}
            className="h-10 w-10 shrink-0 rounded-full bg-primary-500 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition">
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <p className="text-xs text-neutral-500 text-center">{t('feed.comments.viewerNotice')}</p>
      )}
    </div>
  );
}
