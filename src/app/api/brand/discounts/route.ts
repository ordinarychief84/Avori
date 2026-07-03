import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { discountSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = discountSchema.parse(await req.json());
    const discount = await prisma.discountCampaign.create({
      data: {
        brandId,
        name: data.name,
        code: data.code ? data.code.toUpperCase() : null,
        type: data.type ?? 'PERCENT',
        value: data.value,
        minSubtotal: data.minSubtotal ?? null,
        status: data.status ?? 'DRAFT',
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        usageLimit: data.usageLimit ?? null,
        perCustomerLimit: data.perCustomerLimit ?? null,
      },
    });
    return ok({ discount }, 201);
  } catch (e) {
    return fail(e);
  }
}
