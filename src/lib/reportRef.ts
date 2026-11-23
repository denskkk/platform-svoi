/** Посилання на контент зберігається на початку причини скарги: «[post #12] …». */
export function parseReportRef(reason: string): { type: string; id: number } | null {
  const m = /^\[([a-z]+) #(\d+)\]/.exec(reason);
  return m ? { type: m[1], id: Number(m[2]) } : null;
}
