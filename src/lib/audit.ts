/** Журнал аудиту: запис про дію модератора/адміністратора. Помилка запису не блокує основну дію. */

import { prisma } from '@/lib/prisma';

export async function logAudit(params: {
  actorId: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  details?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        details: (params.details ?? undefined) as any,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
