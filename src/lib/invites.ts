/** Реферальний код користувача, лічильники запрошень і статус «активного учасника». */
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без схожих символів 0/O, 1/I
export function newRefCode(): string {
  const bytes = randomBytes(8);
  let s = '';
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

/** Повертає код користувача, створюючи його при першому зверненні. */
export async function ensureRefCode(userId: number): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { refCode: true } });
  if (u?.refCode) return u.refCode;
  for (let i = 0; i < 5; i++) {
    const code = newRefCode();
    try {
      const upd = await prisma.user.updateMany({ where: { id: userId, refCode: null }, data: { refCode: code } });
      if (upd.count) return code;
      const again = await prisma.user.findUnique({ where: { id: userId }, select: { refCode: true } });
      if (again?.refCode) return again.refCode;
    } catch { /* колізія унікального коду — пробуємо ще */ }
  }
  throw new Error('ref code generation failed');
}

export function normalizeRefCode(raw: unknown): string | null {
  const s = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  return /^[A-Z0-9]{6,16}$/.test(s) ? s : null;
}

/** «Активний учасник»: запросив хоча б одну людину і має хоча б одну завершену угоду. */
export const ACTIVE_MIN_INVITED = 1;
export const ACTIVE_MIN_DEALS = 1;
export function isActiveParticipant(invited: number, deals: number): boolean {
  return invited >= ACTIVE_MIN_INVITED && deals >= ACTIVE_MIN_DEALS;
}

export const COMPLETED_DEAL_STATUSES = ['confirmed', 'accrued', 'paid_out'];
