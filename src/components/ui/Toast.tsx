'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const value = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    warning: (message: string) => addToast(message, 'warning'),
    info: (message: string) => addToast(message, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    // Автоматичне закриття через 5 секунд
    const timer = setTimeout(handleClose, 5000);
    return () => clearTimeout(timer);
  }, []);

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
      border: 'border-green-200',
      iconBg: 'bg-green-500',
      icon: <CheckCircle className="w-5 h-5 text-white" />,
      text: 'text-green-800',
      progressBar: 'bg-green-500',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-rose-50',
      border: 'border-red-200',
      iconBg: 'bg-red-500',
      icon: <XCircle className="w-5 h-5 text-white" />,
      text: 'text-red-800',
      progressBar: 'bg-red-500',
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-50 to-orange-50',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-500',
      icon: <AlertCircle className="w-5 h-5 text-white" />,
      text: 'text-yellow-800',
      progressBar: 'bg-yellow-500',
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-500',
      icon: <Info className="w-5 h-5 text-white" />,
      text: 'text-blue-800',
      progressBar: 'bg-blue-500',
    },
  };

  const style = styles[toast.type];

  return (
    <div
      className={`
        ${style.bg} ${style.border}
        flex items-start gap-3 min-w-[320px] max-w-md p-4 rounded-xl border-2 shadow-2xl
        transform transition-all duration-300 ease-out backdrop-blur-sm
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100 animate-slide-in-right'}
        relative overflow-hidden
      `}
      role="alert"
    >
      {/* Іконка з градієнтом */}
      <div className={`${style.iconBg} rounded-lg p-2 flex-shrink-0 shadow-lg animate-scale-in`}>
        {style.icon}
      </div>

      {/* Повідомлення */}
      <p className={`flex-1 text-sm font-medium ${style.text} leading-relaxed pt-1`}>
        {toast.message}
      </p>

      {/* Кнопка закриття */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded-lg hover:bg-white/50"
        aria-label="Закрити"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Прогрес бар */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 overflow-hidden">
        <div
          className={`h-full ${style.progressBar} animate-progress`}
          style={{
            animation: 'shrink-progress 5s linear',
          }}
        />
      </div>

      {/* Inline стилі для анімації прогресу */}
      <style jsx>{`
        @keyframes shrink-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
