/** Серверна перевірка прав у клубі (не імпортувати на клієнті). */
import { prisma } from '@/lib/prisma';


/** Права користувача в клубі: власник / активний учасник (+ право писати). */
export async function getClubAccess(clubId: number, userId: number) {
  const club = await prisma.club.findFirst({ where: { id: clubId, isHidden: false }, select: { id: true, ownerId: true, joinMode: true, postMode: true, visibility: true } });
  if (!club) return null;
  const m = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId, userId } }, select: { status: true, canWrite: true } });
  const isOwner = club.ownerId === userId;
  const active = isOwner || m?.status === 'active';
  return {
    club, isOwner, active,
    canSee: club.visibility === 'public' || active,
    canPost: isOwner || (active && (club.postMode === 'members' || !!m?.canWrite)),
  };
}
