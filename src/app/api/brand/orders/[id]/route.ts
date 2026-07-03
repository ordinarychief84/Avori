import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { orderStatusSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { emitWebhook } from '@/lib/webhooks';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const order = await prisma.order.findFirst({
      where: { id: params.id, brandId },
      include: { items: { include: { product: true } }, customer: true },
    });
    if (!order) throw new HttpError(404, 'Order not found');
    return ok({ order });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = orderStatusSchema.parse(await req.json());
    const existing = await prisma.order.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Order not found');

    const order = await prisma.order.update({
      where: { id: existing.id },
      data: { status: data.status },
    });

    // Keep customer lifetime stats honest when an order is cancelled/refunded.
    const wasCounted = !['CANCELLED', 'REFUNDED'].includes(existing.status);
    const nowCounted = !['CANCELLED', 'REFUNDED'].includes(order.status);
    if (existing.customerId && wasCounted !== nowCounted) {
      const sign = nowCounted ? 1 : -1;
      await prisma.customer.update({
        where: { id: existing.customerId },
        data: {
          ordersCount: { increment: sign },
          totalSpent: { increment: sign * Number(existing.total) },
        },
      });
    }

    await emitWebhook(brandId, 'order.updated', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
    });
    return ok({ order });
  } catch (e) {
    return fail(e);
  }
}
