import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { orderCreateSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { ingestOrder } from '@/lib/orders';

export async function GET(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const url = new URL(req.url);
    const rawLimit = Number(url.searchParams.get('limit') ?? 100);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 100;
    const cursor = url.searchParams.get('cursor') || undefined;
    const orders = await prisma.order.findMany({
      where: { brandId },
      orderBy: { placedAt: 'desc' },
      include: { customer: { select: { email: true, firstName: true, lastName: true } } },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = orders.length > limit;
    const page = hasMore ? orders.slice(0, limit) : orders;
    return ok({ orders: page, nextCursor: hasMore ? page[page.length - 1].id : null });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = orderCreateSchema.parse(await req.json());
    const order = await ingestOrder(brandId, {
      ...data,
      placedAt: data.placedAt ? new Date(data.placedAt) : undefined,
      source: 'manual',
    });
    return ok({ order }, 201);
  } catch (e) {
    return fail(e);
  }
}
