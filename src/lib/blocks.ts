/**
 * Блокування користувачів. Блокування діє в обидва боки: той, хто заблокував, і той,
 * кого заблокували, не бачать контент один одного та не можуть взаємодіяти.
 */

import { prisma } from '@/lib/prisma';

/** id усіх, з ким у користувача є блокування (у будь-який бік). */
export async function getBlockedIds(userId: number): Promise<number[]> {
  const rows = await prisma.userBlock.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<number>();
  for (const r of rows) ids.add(r.blockerId === userId ? r.blockedId : r.blockerId);
  return Array.from(ids);
}

export async function isBlockedBetween(a: number, b: number): Promise<boolean> {
  if (a === b) return false;
  const found = await prisma.userBlock.findFirst({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
    select: { id: true },
  });
  return !!found;
}
