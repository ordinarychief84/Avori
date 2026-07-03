import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { discountSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = discountSchema.partial().parse(await req.json());
    const existing = await prisma.discountCampaign.findFirst({
      where: { id: params.id, brandId },
    });
    if (!existing) throw new HttpError(404, 'Discount not found');
    const discount = await prisma.discountCampaign.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.code !== undefined ? { code: data.code ? data.code.toUpperCase() : null } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.value !== undefined ? { value: data.value } : {}),
        ...(data.minSubtotal !== undefined ? { minSubtotal: data.minSubtotal } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.startsAt !== undefined
          ? { startsAt: data.startsAt ? new Date(data.startsAt) : null }
          : {}),
        ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}),
        ...(data.usageLimit !== undefined ? { usageLimit: data.usageLimit } : {}),
        ...(data.perCustomerLimit !== undefined ? { perCustomerLimit: data.perCustomerLimit } : {}),
      },
    });
    return ok({ discount });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.discountCampaign.findFirst({
      where: { id: params.id, brandId },
    });
    if (!existing) throw new HttpError(404, 'Discount not found');
    await prisma.discountCampaign.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
