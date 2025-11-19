"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ProgressItem {
  action: string;
  progress: number;
  progressMax: number;
  missingFields?: string[];
  completed: boolean;
}

export function ProfileCompletionHint() {
  const [item, setItem] = useState<ProgressItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        const res = await fetch('/api/earning/progress', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        const prof = (data.progress || []).find((p: any) => p.action === 'PROFILE_COMPLETE');
        if (prof) setItem(prof);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return null;
  if (!item) return null;
  if (item.completed) {
    return (
      <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3 text-sm text-green-700">
        <CheckCircle className="w-4 h-4" /> Профіль заповнено на 100%.
      </div>
    );
  }

  const pct = item.progressMax > 0 ? Math.round((item.progress / item.progressMax) * 100) : 0;
  const missing = (item.missingFields || []).slice(0,5);

  return (
    <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-neutral-800">
        <AlertCircle className="w-4 h-4 text-indigo-600" /> Заповнення профілю: {pct}%
      </div>
      {missing.length > 0 && (
        <p className="text-xs text-neutral-600 mb-2">Відсутні: {missing.join(', ')}{item.missingFields && item.missingFields.length>5 ? '…' : ''}</p>
      )}
      <Link href="/profile/edit" className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium">
        Заповнити зараз
      </Link>
    </div>
  );
}
