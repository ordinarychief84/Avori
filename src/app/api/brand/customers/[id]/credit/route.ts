import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { creditAdjustSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { addCredit } from '@/lib/credit';
import { audit } from '@/lib/audit';

// Manual store-credit adjustment from the customer detail page.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId, userId } = await requireBrand();
    const data = creditAdjustSchema.parse(await req.json());
    const customer = await prisma.customer.findFirst({ where: { id: params.id, brandId } });
    if (!customer) throw new HttpError(404, 'Customer not found');

    const account = await addCredit({
      brandId,
      customerId: customer.id,
      type: 'ADJUST',
      amount: data.amount,
      reason: data.reason,
    });
    await audit({
      brandId,
      userId,
      action: 'credit.adjust',
      entity: 'customer',
      entityId: customer.id,
      meta: { amount: data.amount, reason: data.reason },
    });
    return ok({ account });
  } catch (e) {
    return fail(e);
  }
}
