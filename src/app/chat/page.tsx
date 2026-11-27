'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, MessageCircle, Send, ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { GroupChatList } from '@/components/chat/GroupChatList';
import { NewGroupForm } from '@/components/chat/NewGroupForm';
import { canCreateGroupChats } from '@/lib/groupRights';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ReportButton } from '@/components/ui/ReportButton';
import { ViewerUpgradeNotice } from '@/components/ui/ViewerUpgradeNotice';
import { useI18n } from '@/i18n/client';
import { localizedPath } from '@/i18n/routes';
import { askConfirm } from '@/components/ui/ConfirmHost';
import { SwipeRow } from '@/components/chat/SwipeRow';

interface Conversation {
  id: number;
  otherUser: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    isActive: boolean;
  };
  lastMessage: {
    id: number;
    content: string;
    senderId: number;
    isRead: boolean;
    createdAt: string;
  } | null;
  unreadCount: number;
  lastMessageAt: string | null;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  isRead: boolean;
}

function ChatPageContent() {
  const router = useRouter();
  const { t, locale, formatDate } = useI18n();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get('with');

  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  // Вкладки месенджера: особисті чати / групові; створення групи — у модальному вікні прямо тут
  const [tab, setTab] = useState<'direct' | 'groups'>('direct');
  const [newGroup, setNewGroup] = useState(false);
  const [plusMenu, setPlusMenu] = useState(false);
  const [groupsKey, setGroupsKey] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  // Чтобы обработать ?with=... один раз и не зациклиться
  const [handledWithParam, setHandledWithParam] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    const initFromLocal = () => {
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedToken) setToken(storedToken);
    };

    // If no local token/user, try cookie-based auth
    if (!storedUser || !storedToken) {
      (async () => {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              // token may not be present in cookie flow
              return;
            }
          }
        } catch (e) {
          // ignore
        }

        // fallback to localStorage
        if (storedUser || storedToken) initFromLocal();
        else router.push('/auth/login');
      })();
    } else {
      initFromLocal();
    }
  }, [router]);

  // «Видалити чат» ховає історію лише для мене; співрозмовник її не втрачає
  const deleteConversation = async (convId: number | null = selectedConversation) => {
    if (!convId) return;
    if (!(await askConfirm(t('chat.deleteConfirm')))) return;
    try {
      const res = await fetch(`/api/conversations/${convId}`, { method: 'DELETE', credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!res.ok) throw new Error();
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (selectedConversation === convId) { setSelectedConversation(null); setMessages([]); }
    } catch {
      setError(t('chat.errors.deleteFailed'));
    }
  };

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch('/api/conversations', {
        credentials: 'include',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setConversations(data.conversations || []);
      } else {
        setError(data.error || t('chat.errors.loadConversations'));
      }
    } catch (err) {
      setError(t('chat.errors.connection'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  const createConversation = useCallback(async (otherUserId: number) => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch('/api/conversations', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ otherUserId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedConversation(data.conversation.id);
        await loadConversations(); // Обновляем список диалогов
      } else {
        setError(data.error || t('chat.errors.createConversation'));
      }
    } catch (err) {
      setError(t('chat.errors.connection'));
    }
  }, [token, loadConversations, t]);

  useEffect(() => {
    if (!withUserId || !user || handledWithParam) return;

    const otherId = parseInt(withUserId);
    if (Number.isNaN(otherId)) return;

    // Если список диалогов уже загружен — пробуем найти, иначе сразу создаем
    const existingConv = conversations.find(c => c.otherUser.id === otherId);
    if (existingConv) {
      setSelectedConversation(existingConv.id);
      setHandledWithParam(true);
    } else {
      // Создаем диалог, если его нет
      createConversation(otherId).finally(() => setHandledWithParam(true));
    }
  }, [withUserId, user, token, conversations, handledWithParam, createConversation]);

  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        credentials: 'include',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
        // Прокручиваем вниз к последнему сообщению
        setTimeout(() => {
          const messagesContainer = document.getElementById('messages-container');
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 100);
      } else {
        setError(data.error || t('chat.errors.loadMessages'));
      }
    } catch (err) {
      setError(t('chat.errors.connection'));
    }
  }, [token, t]);

  useEffect(() => {
    if (selectedConversation && user) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation, token, loadMessages]);

  // Poll new messages periodically to simulate real-time updates
  useEffect(() => {
    if (!selectedConversation || !user) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled || document.visibilityState === 'hidden') return;
      try {
        await loadMessages(selectedConversation);
        // Also refresh conversations to keep preview/unread in sync
        await loadConversations();
      } catch {}
    }, 3000); // every 3s

    const onFocus = async () => {
      try {
        await loadMessages(selectedConversation);
        await loadConversations();
      } catch {}
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [selectedConversation, token, loadMessages, loadConversations]);

  

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`/api/conversations/${selectedConversation}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ content: messageText }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([...messages, data.message]);
        setMessageText('');
        
        // Прокручиваем вниз
        setTimeout(() => {
          const messagesContainer = document.getElementById('messages-container');
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 100);

        // Обновляем список диалогов
        await loadConversations();
      } else {
        setError(data.error || t('chat.errors.sendMessage'));
      }
    } catch (err) {
      setError(t('chat.errors.connection'));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return formatDate(date, { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return t('chat.yesterday');
    } else if (days < 7) {
      return formatDate(date, { weekday: 'short' });
    } else {
      return formatDate(date, { day: 'numeric', month: 'short' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">{t('chat.loading')}</div>
      </div>
    );
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="bg-neutral-100">
      <div className="chat-box max-w-7xl mx-auto h-[calc(100dvh-9rem)] md:h-[calc(100dvh-4rem)] flex flex-col">
        {/* Header: на телефоні ховаємо, коли відкрита розмова */}
        <div className={`bg-white border-b border-neutral-200 px-4 py-3 ${selectedConv ? 'hidden md:block' : ''}`}>
          <div className="flex items-center gap-3">
            <Link href={localizedPath('/feed', locale)} className="text-neutral-600 hover:text-neutral-900" aria-label={t('chat.back')}>
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900 flex-1">{t('chat.title')}</h1>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <ViewerUpgradeNotice className="mx-4 mt-4" />

        <div className="flex-1 flex overflow-hidden">
          {/* Список диалогов */}
          <div className={`w-full md:w-96 md:shrink-0 bg-white border-r border-neutral-200 overflow-y-auto ${selectedConv ? 'hidden md:block' : ''}`}>
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-neutral-100 bg-white px-3 py-2">
              <div role="tablist" className="grid flex-1 grid-cols-2 rounded-full bg-neutral-100 p-1 text-sm font-semibold">
                {(['direct', 'groups'] as const).map((k) => (
                  <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                    className={`rounded-full py-1.5 transition ${tab === k ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}>
                    {k === 'direct' ? t('chat.tabs.direct') : t('chat.tabs.groups')}
                  </button>
                ))}
              </div>
              {canCreateGroupChats(user) && (
                <div className="relative shrink-0">
                  <button type="button" onClick={() => setPlusMenu((v) => !v)} aria-expanded={plusMenu} aria-label={t('chat.create')} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-neutral-900 hover:bg-primary-600">
                    <Plus className="h-5 w-5" />
                  </button>
                  {plusMenu && (
                    <>
                      <button type="button" className="fixed inset-0 z-20 cursor-default" aria-label={t('chat.back')} onClick={() => setPlusMenu(false)} />
                      <div className="absolute right-0 top-11 z-30 w-60 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-xl">
                        <button type="button" onClick={() => { setPlusMenu(false); setNewGroup(true); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                          <MessageCircle className="h-5 w-5 text-neutral-500" />{t('chat.createGroupChat')}
                        </button>
                        <Link href="/clubs/new" onClick={() => setPlusMenu(false)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                          <ClipboardList className="h-5 w-5 text-neutral-500" />{t('chat.createBoard')}
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            {tab === 'groups' ? (
              <GroupChatList onCreate={() => setNewGroup(true)} reloadKey={groupsKey} />
            ) : loading ? (
              <div className="p-4 text-center text-neutral-600">{t('chat.loading')}</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">{t('chat.empty.title')}</p>
                <p className="text-sm text-neutral-400 mt-2">
                  {t('chat.empty.hint')}
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <SwipeRow
                  key={conv.id}
                  onOpen={() => setSelectedConversation(conv.id)}
                  onDelete={() => deleteConversation(conv.id)}
                  label={t('chat.deleteChat')}
                  className="mx-2 my-1"
                >
                  <div className={`px-3 py-2.5 rounded-xl hover:bg-neutral-100 transition-colors ${selectedConversation === conv.id ? 'bg-primary-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={conv.otherUser.avatarUrl}
                      alt={`${conv.otherUser.firstName} ${conv.otherUser.lastName}`}
                      className="w-14 h-14 rounded-full shrink-0"
                      fallbackName={`${conv.otherUser.firstName} ${conv.otherUser.lastName}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {conv.otherUser.firstName} {conv.otherUser.lastName}
                        </h3>
                        {conv.lastMessage && (
                          <span className="text-xs text-neutral-500">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-neutral-900' : 'text-neutral-600'}`}>
                            {conv.lastMessage.senderId === user.id && t('chat.you')}
                            {conv.lastMessage.content}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary-600 text-white text-xs rounded-full min-w-[20px] text-center px-1.5 py-0.5 ml-2 shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </SwipeRow>
              ))
            )}
          </div>

          {/* Окно чата */}
          <div className={`flex-1 min-w-0 flex-col bg-white ${selectedConv ? 'flex' : 'hidden md:flex'}`}>
            {selectedConv ? (
              <>
                {/* Шапка чата */}
                <div className="border-b border-neutral-200 px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setSelectedConversation(null)} className="md:hidden p-1.5 -ml-1 text-primary-600 hover:bg-neutral-100 rounded-full" aria-label={t('chat.back')}>
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <UserAvatar
                      src={selectedConv.otherUser.avatarUrl}
                      alt={`${selectedConv.otherUser.firstName} ${selectedConv.otherUser.lastName}`}
                      className="w-10 h-10 rounded-full"
                      fallbackName={`${selectedConv.otherUser.firstName} ${selectedConv.otherUser.lastName}`}
                    />
                    <div>
                      <h2 className="font-semibold text-neutral-900">
                        {selectedConv.otherUser.firstName} {selectedConv.otherUser.lastName}
                      </h2>
                      <Link
                        href={`/profile/${selectedConv.otherUser.id}`}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        {t('chat.viewProfile')}
                      </Link>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <button type="button" onClick={() => deleteConversation()} aria-label={t('chat.deleteChat')} title={t('chat.deleteChat')}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <ReportButton
                        reportedUserId={selectedConv.otherUser.id}
                        contentType="user"
                        label={t('chat.report')}
                      />
                    </div>
                  </div>
                </div>

                {/* Сообщения */}
                <div
                  id="messages-container"
                  className="flex-1 overflow-y-auto p-4 space-y-1.5 bg-white"
                >
                  {messages.map((message) => {
                    const isOwn = message.senderId === user.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] md:max-w-md px-3.5 py-2 rounded-3xl ${
                            isOwn
                              ? 'bg-primary-600 text-white'
                              : 'bg-neutral-100 text-neutral-900'
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-primary-100' : 'text-neutral-500'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Форма отправки */}
                <form onSubmit={sendMessage} className="border-t border-neutral-200 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] md:pb-2.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={t('chat.placeholder')}
                      className="flex-1 px-4 py-2.5 bg-neutral-100 rounded-full text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className="bg-primary-600 text-white h-10 w-10 flex items-center justify-center rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-400">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                  <p>{t('chat.selectConversation')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {newGroup && (
        <div style={{ top: 'var(--vv-top, 0px)', height: 'var(--vvh, 100%)' }} className="fixed inset-x-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={t('cabinet.groupChats.new')}>
          <button type="button" className="absolute inset-0 bg-black/50" aria-label={t('chat.back')} onClick={() => setNewGroup(false)} />
          <div className="relative max-h-full w-full overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-4 pb-[calc(1rem+var(--safe-area-inset-bottom,0px))] sm:max-w-md sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900">{t('cabinet.groupChats.new')}</h2>
              <button type="button" onClick={() => setNewGroup(false)} aria-label={t('chat.back')} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"><X className="h-5 w-5" /></button>
            </div>
            <NewGroupForm onCreated={(id) => { setNewGroup(false); setGroupsKey((k) => k + 1); router.push(`/chat/groups/${id}`); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function ChatFallback() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-neutral-600">{t('chat.loadingChat')}</div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatFallback />}>
      <ChatPageContent />
    </Suspense>
  );
}
