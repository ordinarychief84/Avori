import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { webhookEndpointSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id: params.id, brandId },
      include: { deliveries: { orderBy: { createdAt: 'desc' }, take: 25 } },
    });
    if (!endpoint) throw new HttpError(404, 'Webhook endpoint not found');
    return ok({ endpoint: { ...endpoint, secret: undefined } });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = webhookEndpointSchema.partial().parse(await req.json());
    const existing = await prisma.webhookEndpoint.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Webhook endpoint not found');
    const endpoint = await prisma.webhookEndpoint.update({
      where: { id: existing.id },
      data: {
        ...(data.url !== undefined ? { url: data.url } : {}),
        ...(data.topics !== undefined ? { topics: data.topics } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });
    return ok({ endpoint: { ...endpoint, secret: undefined } });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.webhookEndpoint.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Webhook endpoint not found');
    await prisma.webhookEndpoint.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
