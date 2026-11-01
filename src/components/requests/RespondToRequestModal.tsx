'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';

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
  const { t } = useI18n();
  const [proposedPrice, setProposedPrice] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proposedPrice || !comment) {
      toast.warning(t('serviceRequests.respondModal.requiredFields'));
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
        throw new Error(error.error || t('serviceRequests.respondModal.failed'));
      }

      toast.success(t('serviceRequests.respondModal.success'));
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
            {t('serviceRequests.respondModal.title')}
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
            <p className="text-sm text-neutral-600 mb-1">{t('serviceRequests.respondModal.requestLabel')}</p>
            <p className="font-medium text-neutral-900">{requestTitle}</p>
          </div>

          {/* Запропонована ціна */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('serviceRequests.respondModal.priceLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={proposedPrice}
              onChange={(e) => setProposedPrice(e.target.value)}
              placeholder={t('serviceRequests.respondModal.pricePlaceholder')}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              {t('serviceRequests.respondModal.priceHint')}
            </p>
          </div>

          {/* Орієнтовний термін */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('serviceRequests.respondModal.daysLabel')}
            </label>
            <input
              type="number"
              min="1"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              placeholder={t('serviceRequests.respondModal.daysPlaceholder')}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {t('serviceRequests.respondModal.daysHint')}
            </p>
          </div>

          {/* Коментар */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('serviceRequests.respondModal.commentLabel')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('serviceRequests.respondModal.commentPlaceholder')}
              rows={5}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              {t('serviceRequests.respondModal.commentHint')}
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
              {t('serviceRequests.common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? t('serviceRequests.respondModal.sending') : t('serviceRequests.respondModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
