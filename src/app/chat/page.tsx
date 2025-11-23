'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';

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
  const searchParams = useSearchParams();
  const withUserId = searchParams.get('with');

  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
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
        setError(data.error || 'Помилка завантаження діалогів');
      }
    } catch (err) {
      setError('Помилка підключення до сервера');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      loadConversations();
    }
  }, [user, token, loadConversations]);

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
        setError(data.error || 'Помилка створення діалогу');
      }
    } catch (err) {
      setError('Помилка підключення до сервера');
    }
  }, [token, loadConversations]);

  useEffect(() => {
    if (!withUserId || !user || !token || handledWithParam) return;

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
        setError(data.error || 'Помилка завантаження повідомлень');
      }
    } catch (err) {
      setError('Помилка підключення до сервера');
    }
  }, [token]);

  useEffect(() => {
    if (selectedConversation && token) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation, token, loadMessages]);

  // Poll new messages periodically to simulate real-time updates
  useEffect(() => {
    if (!selectedConversation || !token) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled) return;
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
        setError(data.error || 'Помилка відправки повідомлення');
      }
    } catch (err) {
      setError('Помилка підключення до сервера');
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
      return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Вчора';
    } else if (days < 7) {
      return date.toLocaleDateString('uk-UA', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Завантаження...</div>
      </div>
    );
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-neutral-600 hover:text-neutral-900">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <MessageCircle className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-bold text-neutral-900">Повідомлення</h1>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Список диалогов */}
          <div className="w-full md:w-1/3 bg-white border-r border-neutral-200 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-neutral-600">Завантаження...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">Немає діалогів</p>
                <p className="text-sm text-neutral-400 mt-2">
                  Перейдіть на профіль користувача та натисніть "Написати"
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`p-4 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors ${
                    selectedConversation === conv.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={conv.otherUser.avatarUrl}
                      alt={`${conv.otherUser.firstName} ${conv.otherUser.lastName}`}
                      className="w-12 h-12 rounded-full"
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
                          <p className="text-sm text-neutral-600 truncate">
                            {conv.lastMessage.senderId === user.id && 'Ви: '}
                            {conv.lastMessage.content}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Окно чата */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedConv ? (
              <>
                {/* Шапка чата */}
                <div className="border-b border-neutral-200 p-4">
                  <div className="flex items-center gap-3">
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
                        Переглянути профіль
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Сообщения */}
                <div
                  id="messages-container"
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                  {messages.map((message) => {
                    const isOwn = message.senderId === user.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
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
                <form onSubmit={sendMessage} className="border-t border-neutral-200 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Напишіть повідомлення..."
                      className="flex-1 px-4 py-2 border border-neutral-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className="bg-primary-600 text-white p-3 rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-400">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                  <p>Оберіть діалог для початку спілкування</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Завантаження чату...</div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
