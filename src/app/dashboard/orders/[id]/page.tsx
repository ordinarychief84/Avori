import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/AppShell';
import RowAction from '@/components/RowAction';
import { fmtMoney, fmtDateTime, customerName } from '@/lib/format';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const { brandId } = await pageBrandSession();
  const order = await prisma.order.findFirst({
    where: { id: params.id, brandId },
    include: { items: { include: { product: true } }, customer: true },
  });
  if (!order) notFound();

  const transitions: { label: string; status: string }[] = [
    { label: 'Mark paid', status: 'PAID' },
    { label: 'Mark fulfilled', status: 'FULFILLED' },
    { label: 'Mark refunded', status: 'REFUNDED' },
    { label: 'Cancel', status: 'CANCELLED' },
  ].filter((t) => t.status !== order.status);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${fmtDateTime(order.placedAt)} · via ${order.source}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
            >
              <ArrowLeft className="h-4 w-4" /> All orders
            </Link>
            {transitions.map((t) => (
              <RowAction
                key={t.status}
                endpoint={`/api/brand/orders/${order.id}`}
                body={{ status: t.status }}
                label={t.label}
                variant={t.status === 'CANCELLED' || t.status === 'REFUNDED' ? 'danger' : 'secondary'}
              />
            ))}
            {order.customer && order.status !== 'REFUNDED' && order.status !== 'CANCELLED' && (
              <RowAction
                endpoint={`/api/brand/orders/${order.id}/refund-credit`}
                method="POST"
                label="Refund to store credit"
                variant="danger"
                successMessage="Refunded as store credit"
              />
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="overflow-hidden">
          <div className="-mx-px overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Qty</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {i.product && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.product.imageUrl} alt="" className="h-10 w-10 rounded-md object-cover ring-1 ring-border" />
                      )}
                      <div>
                        <div className="font-medium text-fg">{i.name}</div>
                        {i.sku && <div className="font-mono text-2xs text-fg-muted">{i.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">{i.quantity}</td>
                  <td className="px-5 py-3.5 text-right text-fg-muted">{fmtMoney(i.price, order.currency)}</td>
                  <td className="px-5 py-3.5 text-right text-fg">
                    {fmtMoney(Number(i.price) * i.quantity, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={3} className="px-5 py-2.5 text-right text-fg-muted">Subtotal</td>
                <td className="px-5 py-2.5 text-right text-fg">{fmtMoney(order.subtotal, order.currency)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-5 py-2.5 text-right text-fg-muted">
                  Discounts {order.discountCodes.length > 0 && `(${order.discountCodes.join(', ')})`}
                </td>
                <td className="px-5 py-2.5 text-right text-fg">
                  −{fmtMoney(order.discountTotal, order.currency)}
                </td>
              </tr>
              <tr className="border-t border-border">
                <td colSpan={3} className="px-5 py-3 text-right font-medium text-fg">Total</td>
                <td className="px-5 py-3 text-right text-base font-semibold text-fg">
                  {fmtMoney(order.total, order.currency)}
                </td>
              </tr>
            </tfoot>
          </table></div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardBody>
              <Badge tone={order.status === 'PAID' || order.status === 'FULFILLED' ? 'success' : order.status === 'PENDING' ? 'neutral' : 'danger'}>
                {order.status.toLowerCase()}
              </Badge>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardBody>
              {order.customer ? (
                <Link href={`/dashboard/customers/${order.customer.id}`} className="text-sm text-fg hover:text-accent">
                  <div className="font-medium">{customerName(order.customer)}</div>
                  <div className="text-fg-muted">{order.customer.email}</div>
                  <div className="mt-1 text-xs text-fg-subtle">
                    {order.customer.ordersCount} orders · {fmtMoney(order.customer.totalSpent)} lifetime
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-fg-muted">No customer linked.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
