import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { customerPatchSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, brandId },
      include: {
        orders: { orderBy: { placedAt: 'desc' }, take: 20, include: { items: true } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 10 },
        loyaltyMember: { include: { tier: true } },
        creditAccount: true,
        referrals: true,
      },
    });
    if (!customer) throw new HttpError(404, 'Customer not found');
    return ok({ customer });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = customerPatchSchema.parse(await req.json());
    const existing = await prisma.customer.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Customer not found');

    const customer = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
        ...(data.firstName !== undefined ? { firstName: data.firstName || null } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName || null } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.acceptsMarketing !== undefined ? { acceptsMarketing: data.acceptsMarketing } : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
        ...(data.birthday !== undefined
          ? { birthday: data.birthday ? new Date(data.birthday) : null }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      },
    });
    return ok({ customer });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.customer.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Customer not found');
    await prisma.customer.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
