import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { addCredit } from '@/lib/credit';
import { emitWebhook } from '@/lib/webhooks';
import { audit } from '@/lib/audit';

// Rise-style refund: mark the order refunded and return its value as store
// credit instead of cash. Keeps revenue in the store and the customer happy.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId, userId } = await requireBrand();
    const order = await prisma.order.findFirst({
      where: { id: params.id, brandId },
      include: { customer: { select: { id: true, email: true } } },
    });
    if (!order) throw new HttpError(404, 'Order not found');
    if (!order.customer) throw new HttpError(400, 'Order has no customer to credit');
    if (order.status === 'REFUNDED') throw new HttpError(400, 'Order is already refunded');
    if (order.status === 'CANCELLED') throw new HttpError(400, 'Cancelled orders cannot be refunded');

    const total = Number(order.total);
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: 'REFUNDED' } }),
      prisma.customer.update({
        where: { id: order.customer.id },
        data: { ordersCount: { increment: -1 }, totalSpent: { increment: -total } },
      }),
    ]);
    const account = await addCredit({
      brandId,
      customerId: order.customer.id,
      type: 'REFUND',
      amount: total,
      reason: `Refund of ${order.orderNumber} to store credit`,
      orderId: order.id,
    });

    await audit({
      brandId,
      userId,
      action: 'order.refund_to_credit',
      entity: 'order',
      entityId: order.id,
      meta: { amount: total, customer: order.customer.email },
    });
    await emitWebhook(brandId, 'order.refunded', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      refundedToCredit: total,
    });
    return ok({ refunded: total, creditBalance: Number(account.balance) });
  } catch (e) {
    return fail(e);
  }
}
