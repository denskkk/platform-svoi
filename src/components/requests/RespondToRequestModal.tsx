'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface RespondToRequestModalProps {
  requestId: number;
  requestTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RespondToRequestModal({
  requestId,
  requestTitle,
  onClose,
  onSuccess
}: RespondToRequestModalProps) {
  const toast = useToast();
  const [proposedPrice, setProposedPrice] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proposedPrice || !comment) {
      toast.warning('Заповніть всі обов\'язкові поля');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/service-requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          proposedPrice: Number(proposedPrice),
          estimatedDays: estimatedDays ? Number(estimatedDays) : null,
          comment
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Помилка відправки пропозиції');
      }

      toast.success('Вашу пропозицію успішно відправлено!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-neutral-900">
            Запропонувати свою ціну
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Заявка */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-neutral-600 mb-1">Заявка</p>
            <p className="font-medium text-neutral-900">{requestTitle}</p>
          </div>

          {/* Запропонована ціна */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Запропонована ціна (УЦМ) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={proposedPrice}
              onChange={(e) => setProposedPrice(e.target.value)}
              placeholder="Наприклад: 500"
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              Вкажіть вашу ціну за виконання роботи в уцмках
            </p>
          </div>

          {/* Орієнтовний термін */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Орієнтовний термін виконання (днів)
            </label>
            <input
              type="number"
              min="1"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              placeholder="Наприклад: 3"
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Скільки днів потрібно для виконання роботи
            </p>
          </div>

          {/* Коментар */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Коментар до пропозиції <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Опишіть, як ви виконаєте цю роботу, який маєте досвід, чому варто обрати саме вас..."
              rows={5}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              Мінімум 20 символів
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition"
              disabled={loading}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Відправка...' : 'Відправити пропозицію'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
