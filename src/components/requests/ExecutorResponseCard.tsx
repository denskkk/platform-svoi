'use client';

import { useState } from 'react';
import { UserOrCompanyAvatar } from '@/components/ui/UserOrCompanyAvatar';
import { Star, Clock, CheckCircle } from 'lucide-react';

interface ResponseCardProps {
  response: {
    id: number;
    proposedPrice: number;
    comment: string;
    estimatedDays: number | null;
    createdAt: string;
    status: string;
    isSelected: boolean;
    executor: {
      id: number;
      firstName: string;
      lastName: string;
      profession: string | null;
      avgRating: number;
      totalReviews: number;
      avatarUrl: string | null;
    };
  };
  onSelect: (responseId: number) => void;
  isSelecting: boolean;
  requestHasExecutor: boolean;
}

export function ExecutorResponseCard({ response, onSelect, isSelecting, requestHasExecutor }: ResponseCardProps) {
  const timeAgo = getTimeAgo(new Date(response.createdAt));

  return (
    <div className={`bg-white border rounded-xl p-6 transition-shadow ${
      response.isSelected 
        ? 'border-green-500 bg-green-50 shadow-lg' 
        : response.status === 'rejected'
        ? 'border-red-200 bg-gray-50 opacity-60'
        : 'border-neutral-200 hover:shadow-md'
    }`}>
      {/* Исполнитель */}
      <div className="flex items-start gap-4 mb-4">
        <UserOrCompanyAvatar 
          user={response.executor} 
          className="w-14 h-14 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-neutral-900">
            {response.executor.firstName} {response.executor.lastName}
          </h3>
          {response.executor.profession && (
            <p className="text-sm text-neutral-600">{response.executor.profession}</p>
          )}
          {response.executor.totalReviews > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium ml-1">
                  {Number(response.executor.avgRating).toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-neutral-500">
                ({response.executor.totalReviews} відгуків)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Предложение */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm text-neutral-600">Ціна:</span>
            <p className="text-2xl font-bold text-primary-600">
              {response.proposedPrice} УЦМ
            </p>
          </div>
          {response.estimatedDays && (
            <div className="text-right">
              <span className="text-sm text-neutral-600">Термін:</span>
              <p className="flex items-center gap-1 text-neutral-900 font-medium">
                <Clock className="w-4 h-4" />
                {response.estimatedDays} {getDaysWord(response.estimatedDays)}
              </p>
            </div>
          )}
        </div>

        <div className="bg-neutral-50 p-4 rounded-lg">
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">
            {response.comment}
          </p>
        </div>
      </div>

      {/* Время и кнопка */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
        <span className="text-xs text-neutral-500">{timeAgo}</span>
        
        {response.isSelected ? (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle className="w-5 h-5" />
            <span>Обрано</span>
          </div>
        ) : response.status === 'rejected' ? (
          <div className="text-sm text-gray-500">Відхилено</div>
        ) : !requestHasExecutor ? (
          <button
            onClick={() => onSelect(response.id)}
            disabled={isSelecting}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Обрати виконавця
          </button>
        ) : (
          <div className="text-sm text-gray-400">Вже обрано іншого виконавця</div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days} ${getDaysWord(days)} тому`;
  if (hours > 0) return `${hours} ${getHoursWord(hours)} тому`;
  if (minutes > 0) return `${minutes} ${getMinutesWord(minutes)} тому`;
  return 'Щойно';
}

function getDaysWord(count: number): string {
  if (count === 1) return 'день';
  if (count >= 2 && count <= 4) return 'дні';
  return 'днів';
}

function getHoursWord(count: number): string {
  if (count === 1) return 'годину';
  if (count >= 2 && count <= 4) return 'години';
  return 'годин';
}

function getMinutesWord(count: number): string {
  if (count === 1) return 'хвилину';
  if (count >= 2 && count <= 4) return 'хвилини';
  return 'хвилин';
}
