'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  User,
  Clock,
  Shield,
  Mail
} from 'lucide-react';

interface Message {
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: number;
  user1: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    city?: string;
  };
  user2: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    city?: string;
  };
  lastMessage?: Message;
  messageCount: number;
  updatedAt: string;
}

interface ConversationDetail {
  conversation: {
    id: number;
    user1: any;
    user2: any;
  };
  messages: Array<{
    id: number;
    content: string;
    createdAt: string;
    sender: any;
    receiver: any;
  }>;
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(storedUser);
    if (!user.isAdmin) {
      router.push('/auth/login');
      return;
    }

    loadConversations();
  }, [page, router]);

  const loadConversations = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search
      });

      const response = await fetch(`/api/admin/messages?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Помилка завантаження переписок');
      }

      const data = await response.json();
      setConversations(data.conversations);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      console.error(err);
      alert('Помилка завантаження переписок');
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId: number) => {
    setMessagesLoading(true);
    
    try {
      const response = await fetch(`/api/admin/messages?conversationId=${conversationId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Помилка завантаження повідомлень');
      }

      const data = await response.json();
      setSelectedConversation(data);
    } catch (err: any) {
      console.error(err);
      alert('Помилка завантаження повідомлень');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadConversations();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-neutral-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => router.push('/admin')}
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад до адмін-панелі
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary-500" />
            Переписки користувачів
          </h1>
          <p className="text-neutral-600">
            Перегляд всіх повідомлень на платформі
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Список переписок */}
          <div className="lg:col-span-1">
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Пошук по імені..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleSearch}
                className="w-full mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                Шукати
              </button>
            </div>

            {/* Conversations List */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-neutral-600">
                  Завантаження...
                </div>
              ) : (
                <>
                  <div className="divide-y divide-neutral-200 max-h-[600px] overflow-y-auto">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => loadConversationMessages(conv.id)}
                        className={`w-full p-4 text-left hover:bg-neutral-50 transition-colors ${
                          selectedConversation?.conversation.id === conv.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-neutral-900">
                            {conv.user1.firstName} {conv.user1.lastName} ↔ {conv.user2.firstName} {conv.user2.lastName}
                          </div>
                          <span className="text-xs text-neutral-500 ml-2">
                            {conv.messageCount}
                          </span>
                        </div>
                        <div className="text-sm text-neutral-600 mb-1">
                          {conv.user1.city && `${conv.user1.city} • `}
                          {conv.user2.city && conv.user2.city}
                        </div>
                        {conv.lastMessage && (
                          <div className="text-sm text-neutral-500 truncate">
                            {conv.lastMessage.content.substring(0, 50)}...
                          </div>
                        )}
                        <div className="text-xs text-neutral-400 mt-1">
                          {new Date(conv.updatedAt).toLocaleString('uk-UA')}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between p-4 bg-neutral-50 border-t border-neutral-200">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="text-sm text-neutral-600">
                      {page} / {totalPages}
                    </div>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Повідомлення */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg h-full">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-neutral-600">Завантаження повідомлень...</div>
                </div>
              ) : selectedConversation ? (
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-6 border-b border-neutral-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-neutral-900 mb-2">
                          Переписка
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{selectedConversation.conversation.user1.firstName} {selectedConversation.conversation.user1.lastName}</span>
                          </div>
                          <span>↔</span>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{selectedConversation.conversation.user2.firstName} {selectedConversation.conversation.user2.lastName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-neutral-500">
                        Всього повідомлень: {selectedConversation.messages.length}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[600px]">
                    {selectedConversation.messages.map((message) => {
                      const isSender1 = message.sender.id === selectedConversation.conversation.user1.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isSender1 ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-[70%] ${isSender1 ? 'bg-blue-100' : 'bg-green-100'} rounded-2xl p-4`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm">
                                {message.sender.firstName} {message.sender.lastName}
                              </span>
                              <span className="text-xs text-neutral-500">
                                {new Date(message.createdAt).toLocaleString('uk-UA')}
                              </span>
                            </div>
                            <div className="text-neutral-900 whitespace-pre-wrap break-words">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-neutral-500">
                  <MessageSquare className="w-16 h-16 mb-4 text-neutral-300" />
                  <p>Оберіть переписку для перегляду</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
