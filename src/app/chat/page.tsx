'use client'

import { useState } from 'react'
import { Search, Send, Paperclip, Image as ImageIcon } from 'lucide-react'

// Тимчасові дані
const mockChats = [
  {
    id: 1,
    name: 'Олександр Коваленко',
    lastMessage: 'Дякую за звернення! Коли буде зручно?',
    time: '14:30',
    unread: 2,
    avatar: '👤',
    online: true,
  },
  {
    id: 2,
    name: 'Марія Петренко',
    lastMessage: 'Так, можу завтра о 15:00',
    time: 'Вчора',
    unread: 0,
    avatar: '👤',
    online: false,
  },
  {
    id: 3,
    name: 'Віктор Шевченко',
    lastMessage: 'Діагностику зроблю безкоштовно',
    time: '2 дні тому',
    unread: 0,
    avatar: '👤',
    online: false,
  },
]

const mockMessages = [
  {
    id: 1,
    text: 'Доброго дня! Цікавить сантехніка',
    sender: 'me',
    time: '14:25',
  },
  {
    id: 2,
    text: 'Вітаю! Який саме вид робіт?',
    sender: 'other',
    time: '14:27',
  },
  {
    id: 3,
    text: 'Потрібно замінити кран на кухні',
    sender: 'me',
    time: '14:28',
  },
  {
    id: 4,
    text: 'Дякую за звернення! Коли буде зручно?',
    sender: 'other',
    time: '14:30',
  },
]

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(mockChats[0])
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      // TODO: Відправка повідомлення
      console.log('Send:', message)
      setMessage('')
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-neutral-50 flex">
      {/* Список чатів */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-r border-neutral-200 flex flex-col">
        {/* Заголовок */}
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900 mb-3">Повідомлення</h2>
          
          {/* Пошук */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук чатів..."
              className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Список */}
        <div className="flex-1 overflow-y-auto">
          {mockChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`w-full p-4 flex items-start space-x-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 ${
                selectedChat.id === chat.id ? 'bg-primary-50' : ''
              }`}
            >
              {/* Аватар */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-200 to-accent-200 rounded-full flex items-center justify-center text-2xl">
                  {chat.avatar}
                </div>
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>

              {/* Інфо */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-neutral-900 truncate">
                    {chat.name}
                  </h3>
                  <span className="text-xs text-neutral-500 ml-2 flex-shrink-0">
                    {chat.time}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-neutral-600 truncate">
                    {chat.lastMessage}
                  </p>
                  {chat.unread > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary-500 text-white text-xs font-semibold rounded-full flex-shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Вікно чату */}
      <div className="hidden md:flex flex-1 flex-col">
        {/* Шапка чату */}
        <div className="p-4 bg-white border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-200 to-accent-200 rounded-full flex items-center justify-center text-xl">
                {selectedChat.avatar}
              </div>
              {selectedChat.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">
                {selectedChat.name}
              </h3>
              <p className="text-xs text-neutral-500">
                {selectedChat.online ? 'в мережі' : 'був(-ла) нещодавно'}
              </p>
            </div>
          </div>
        </div>

        {/* Повідомлення */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  msg.sender === 'me'
                    ? 'bg-primary-500 text-white rounded-br-none'
                    : 'bg-white text-neutral-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender === 'me' ? 'text-primary-100' : 'text-neutral-500'
                }`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Поле вводу */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-neutral-200">
          <div className="flex items-end space-x-2">
            <button
              type="button"
              className="p-2 text-neutral-500 hover:text-primary-600 transition-colors"
              aria-label="Прикріпити файл"
            >
              <Paperclip className="w-6 h-6" />
            </button>
            <button
              type="button"
              className="p-2 text-neutral-500 hover:text-primary-600 transition-colors"
              aria-label="Надіслати фото"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Напишіть повідомлення..."
              className="flex-1 px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Надіслати"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>

      {/* Mobile заглушка */}
      <div className="md:hidden flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <div className="text-6xl mb-4">💬</div>
          <p className="text-neutral-600">
            Оберіть чат зі списку ліворуч
          </p>
        </div>
      </div>
    </div>
  )
}
