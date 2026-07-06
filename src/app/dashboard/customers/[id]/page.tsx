import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import EntityDialog from '@/components/EntityDialog';
import RowDelete from '@/components/RowDelete';
import { fmtMoney, fmtDate, fmtDateTime, customerName } from '@/lib/format';

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { brandId } = await pageBrandSession();
  const customer = await prisma.customer.findFirst({
    where: { id: params.id, brandId },
    include: {
      orders: { orderBy: { placedAt: 'desc' }, take: 15, include: { items: true } },
      reviews: { orderBy: { createdAt: 'desc' }, take: 8, include: { product: { select: { name: true } } } },
      loyaltyMember: {
        include: { tier: true, transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
      },
      creditAccount: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 5 } } },
      referrals: true,
      quizResponses: { orderBy: { createdAt: 'desc' }, take: 5, include: { quiz: { select: { title: true } } } },
      shadeProfiles: { orderBy: { createdAt: 'desc' }, take: 3 },
    },
  });
  if (!customer) notFound();

  const referral = customer.referrals[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={customerName(customer)}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {customer.email}
            {customer.tags.map((t) => (
              <Badge key={t} tone="neutral">
                {t}
              </Badge>
            ))}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/customers"
              className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
            >
              <ArrowLeft className="h-4 w-4" /> All customers
            </Link>
            <EntityDialog
              title="Edit customer"
              endpoint={`/api/brand/customers/${customer.id}`}
              method="PATCH"
              triggerLabel="Edit"
              triggerVariant="secondary"
              triggerIcon="pencil"
              initial={{
                email: customer.email,
                firstName: customer.firstName ?? '',
                lastName: customer.lastName ?? '',
                phone: customer.phone ?? '',
                birthday: customer.birthday?.toISOString() ?? '',
                tags: customer.tags,
                acceptsMarketing: customer.acceptsMarketing,
                notes: customer.notes ?? '',
              }}
              fields={[
                { name: 'email', label: 'Email', type: 'text', required: true },
                { name: 'firstName', label: 'First name', type: 'text' },
                { name: 'lastName', label: 'Last name', type: 'text' },
                { name: 'phone', label: 'Phone', type: 'text' },
                { name: 'birthday', label: 'Birthday', type: 'date' },
                { name: 'tags', label: 'Tags', type: 'tags' },
                { name: 'acceptsMarketing', label: 'Marketing', type: 'toggle', placeholder: 'Accepts marketing emails' },
                { name: 'notes', label: 'Notes', type: 'textarea' },
              ]}
            />
            <RowDelete
              endpoint={`/api/brand/customers/${customer.id}`}
              confirm={`Delete ${customer.email} and their related data?`}
              redirectTo="/dashboard/customers"
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Orders" value={customer.ordersCount} />
        <Stat label="Total spent" value={fmtMoney(customer.totalSpent)} />
        <Stat
          label="Points"
          value={customer.loyaltyMember?.points ?? 0}
          sub={customer.loyaltyMember?.tier?.name ?? 'No tier'}
        />
        <Stat label="Store credit" value={fmtMoney(customer.creditAccount?.balance ?? 0)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <EntityDialog
          title="Adjust points"
          description="Positive numbers add points, negative numbers remove them."
          endpoint={`/api/brand/customers/${customer.id}/points`}
          method="POST"
          triggerLabel="Adjust points"
          triggerVariant="secondary"
          triggerSize="sm"
          triggerIcon="none"
          fields={[
            { name: 'points', label: 'Points', type: 'number', required: true, placeholder: '100 or -100' },
            { name: 'reason', label: 'Reason', type: 'text', required: true, placeholder: 'Goodwill credit' },
          ]}
        />
        <EntityDialog
          title="Adjust store credit"
          description="Positive amounts issue credit, negative amounts remove it."
          endpoint={`/api/brand/customers/${customer.id}/credit`}
          method="POST"
          triggerLabel="Adjust credit"
          triggerVariant="secondary"
          triggerSize="sm"
          triggerIcon="none"
          fields={[
            { name: 'amount', label: 'Amount', type: 'number', required: true, step: '0.01' },
            { name: 'reason', label: 'Reason', type: 'text', required: true },
          ]}
        />
        <EntityDialog
          title="Create referral code"
          description="Generates a personal referral code this customer can share."
          endpoint="/api/brand/referrals"
          method="POST"
          triggerLabel={referral ? `Referral: ${referral.code}` : 'Create referral code'}
          triggerVariant="secondary"
          triggerSize="sm"
          triggerIcon="none"
          initial={{ customerId: customer.id }}
          fields={[{ name: 'customerId', label: 'Customer ID', type: 'text', hint: 'Prefilled' }]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {customer.orders.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-fg-muted">No orders yet.</p>
            ) : (
              <div className="-mx-px overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
                <tbody>
                  {customer.orders.map((o) => (
                    <tr key={o.id} className="border-t border-border/60">
                      <td className="px-5 py-3">
                        <Link href={`/dashboard/orders/${o.id}`} className="font-medium text-fg hover:text-accent">
                          {o.orderNumber}
                        </Link>
                        <div className="text-xs text-fg-muted">
                          {o.items.length} item{o.items.length === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={o.status === 'PAID' || o.status === 'FULFILLED' ? 'success' : 'neutral'}>
                          {o.status.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right text-fg">{fmtMoney(o.total, o.currency)}</td>
                      <td className="px-5 py-3 text-right text-xs text-fg-muted">{fmtDate(o.placedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loyalty activity</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {!customer.loyaltyMember || customer.loyaltyMember.transactions.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-fg-muted">No points activity yet.</p>
            ) : (
              <div className="-mx-px overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
                <tbody>
                  {customer.loyaltyMember.transactions.map((t) => (
                    <tr key={t.id} className="border-t border-border/60">
                      <td className="px-5 py-3">
                        <div className="font-medium text-fg">{t.type.toLowerCase()}</div>
                        {t.reason && <div className="text-xs text-fg-muted">{t.reason}</div>}
                      </td>
                      <td className={`px-5 py-3 text-right font-medium ${t.points >= 0 ? 'text-success' : 'text-danger'}`}>
                        {t.points >= 0 ? '+' : ''}
                        {t.points}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-fg-muted">{fmtDateTime(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {customer.reviews.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-fg-muted">No reviews yet.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {customer.reviews.map((r) => (
                  <div key={r.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-fg">{r.product.name}</span>
                      <span className="text-xs text-fg-muted">{'★'.repeat(r.rating)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{r.body}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
          </CardHeader>
          <CardBody>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-fg-muted">Referral code</dt>
                <dd className="font-mono text-fg">{referral?.code ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-muted">Referral conversions</dt>
                <dd className="text-fg">{referral?.conversions ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-muted">Quiz responses</dt>
                <dd className="text-fg">
                  {customer.quizResponses.map((r) => r.quiz.title).join(', ') || '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-muted">Shade profile</dt>
                <dd className="text-fg">
                  {customer.shadeProfiles[0]
                    ? `${customer.shadeProfiles[0].skinTone} / ${customer.shadeProfiles[0].undertone}`
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-muted">Birthday</dt>
                <dd className="text-fg">{fmtDate(customer.birthday)}</dd>
              </div>
              {customer.notes && (
                <div className="pt-2">
                  <dt className="text-fg-muted">Notes</dt>
                  <dd className="mt-1 text-fg">{customer.notes}</dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
