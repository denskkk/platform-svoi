"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";

interface TaskItem {
  action: string;
  description: string;
  amount: number;
  completed: boolean;
  isRepeatable: boolean;
}

export function EarnQuickList() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        let token: string | null = null;
        try { token = localStorage.getItem("token"); } catch {}
        if (!token) { setLoading(false); return; }
        const res = await fetch('/api/earning/progress', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Не вдалося завантажити завдання');
        const data = await res.json();
        const incomplete = (data.progress || []).filter((t: TaskItem) => !t.completed).slice(0,5);
        setTasks(incomplete);
      } catch (e:any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-xl border border-neutral-200 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (error || tasks.length === 0) {
    return (
      <div className="p-4 bg-white rounded-xl border border-neutral-200 text-sm text-neutral-600">
        <div className="mb-2 font-semibold">Заробити уцмки</div>
        <p className="text-neutral-500">Перейдіть до повного списку завдань.</p>
        <Link href="/earn" className="inline-flex items-center mt-2 text-primary-600 hover:text-primary-700 font-medium text-sm">
          Повний список <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-neutral-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-800">Заробити уцмки</h3>
        <Link href="/earn" className="text-xs text-primary-600 hover:text-primary-700 inline-flex items-center">
          Все <ArrowRight className="w-3 h-3 ml-1" />
        </Link>
      </div>
      <ul className="space-y-2">
        {tasks.map(t => (
          <li key={t.action} className="flex items-start gap-2">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-primary-500" />
            <div className="flex-1 text-xs text-neutral-700">
              <span className="font-medium">+{t.amount}</span> — {t.description}
              {t.isRepeatable && <span className="ml-1 text-[10px] px-1 py-0.5 bg-blue-100 text-blue-600 rounded">повторюване</span>}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 text-xs text-neutral-500 flex items-center gap-1">
        <CheckCircle className="w-3 h-3 text-green-500" /> Виконайте, щоб збільшити баланс
      </div>
    </div>
  );
}
