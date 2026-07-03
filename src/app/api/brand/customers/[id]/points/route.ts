import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { pointsAdjustSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { ensureMember, addPoints } from '@/lib/loyalty';
import { audit } from '@/lib/audit';

// Manual points adjustment from the customer detail page.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId, userId } = await requireBrand();
    const data = pointsAdjustSchema.parse(await req.json());
    const customer = await prisma.customer.findFirst({ where: { id: params.id, brandId } });
    if (!customer) throw new HttpError(404, 'Customer not found');

    const member = await ensureMember(brandId, customer.id);
    const updated = await addPoints({
      brandId,
      memberId: member.id,
      type: 'ADJUST',
      points: data.points,
      reason: data.reason,
    });
    await audit({
      brandId,
      userId,
      action: 'loyalty.adjust',
      entity: 'customer',
      entityId: customer.id,
      meta: { points: data.points, reason: data.reason },
    });
    return ok({ member: updated });
  } catch (e) {
    return fail(e);
  }
}
