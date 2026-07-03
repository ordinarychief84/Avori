import { prisma } from './prisma';

// Best-effort audit trail. Never throws — a failed audit write must not fail
// the action it documents.
export async function audit(entry: {
  brandId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        brandId: entry.brandId,
        userId: entry.userId ?? null,
        userEmail: entry.userEmail ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        meta: entry.meta ? JSON.parse(JSON.stringify(entry.meta)) : undefined,
        ip: entry.ip ?? null,
      },
    });
  } catch (e) {
    console.error('audit write failed', e);
  }
}
