import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import EntityDialog from '@/components/EntityDialog';
import CopyField from '@/components/CopyField';
import { fmtMoney, customerName } from '@/lib/format';

export default async function ReferralsPage() {
  const { brandId } = await pageBrandSession();

  const program = await prisma.referralProgram.upsert({
    where: { brandId },
    update: {},
    create: { brandId },
  });

  const [referrals, flagged, totals] = await Promise.all([
    prisma.referral.findMany({
      where: { brandId },
      orderBy: { conversions: 'desc' },
      take: 50,
      include: { customer: true },
    }),
    prisma.referralEvent.findMany({
      where: { brandId, flagged: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { referral: { include: { customer: { select: { email: true } } } } },
    }),
    prisma.referral.aggregate({
      where: { brandId },
      _sum: { clicks: true, conversions: true, revenue: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Referral Program"
        description="Customer, employee and influencer advocacy with self-referral and repeat-IP fraud protection built in."
        actions={
          <>
          <EntityDialog
            title="Issue a referral code"
            description="Give a code to a customer, an employee or an influencer. Advocates get a tagged customer record so their results stay trackable."
            endpoint="/api/brand/referrals"
            triggerLabel="Issue code"
            fields={[
              { name: 'email', label: 'Email', type: 'text', required: true, placeholder: 'advocate@brand.com' },
              { name: 'name', label: 'Name', type: 'text', placeholder: 'Maya Chen' },
              {
                name: 'kind',
                label: 'Advocate type',
                type: 'select',
                options: [
                  { value: 'CUSTOMER', label: 'Customer' },
                  { value: 'EMPLOYEE', label: 'Employee' },
                  { value: 'INFLUENCER', label: 'Influencer' },
                ],
              },
            ]}
          />
          <EntityDialog
            title="Program settings"
            endpoint="/api/brand/referrals/program"
            method="PATCH"
            triggerLabel="Program settings"
            triggerVariant="secondary"
            triggerIcon="none"
            initial={{
              enabled: program.enabled,
              referrerPoints: program.referrerPoints,
              referrerCredit: Number(program.referrerCredit),
              refereeDiscountPct: program.refereeDiscountPct,
            }}
            fields={[
              { name: 'enabled', label: 'Program', type: 'toggle', placeholder: 'Referral program enabled' },
              { name: 'referrerPoints', label: 'Referrer reward, loyalty points', type: 'number', hint: 'Requires loyalty program enabled' },
              { name: 'referrerCredit', label: 'Referrer reward, store credit ($)', type: 'number', step: '0.01' },
              { name: 'refereeDiscountPct', label: 'Friend discount on first order (%)', type: 'number', min: 0, max: 100 },
            ]}
          />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Status" value={program.enabled ? 'Active' : 'Off'} />
        <Stat label="Link clicks" value={totals._sum.clicks ?? 0} />
        <Stat label="Converted orders" value={totals._sum.conversions ?? 0} />
        <Stat label="Referred revenue" value={fmtMoney(totals._sum.revenue ?? 0)} />
      </div>

      {referrals.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No referral codes yet"
          description="Create a referral code from any customer's page, or via POST /api/brand/referrals."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="-mx-px overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                <th className="px-5 py-3">Referrer</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Clicks</th>
                <th className="px-5 py-3">Conversions</th>
                <th className="px-5 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5">
                    <Link href={`/dashboard/customers/${r.customerId}`} className="font-medium text-fg hover:text-accent">
                      {customerName(r.customer)}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={r.kind === 'CUSTOMER' ? 'neutral' : 'accent'}>
                      {r.kind.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <CopyField value={r.code} />
                  </td>
                  <td className="px-5 py-3.5 text-fg-muted">{r.clicks}</td>
                  <td className="px-5 py-3.5 text-fg">{r.conversions}</td>
                  <td className="px-5 py-3.5 text-fg">{fmtMoney(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Card>
      )}

      {flagged.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fraud protection, flagged conversions</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="-mx-px overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
              <tbody>
                {flagged.map((f) => (
                  <tr key={f.id} className="border-t border-border/60">
                    <td className="px-5 py-3 text-fg">{f.referral.customer.email}</td>
                    <td className="px-5 py-3 text-fg-muted">{f.refereeEmail ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge tone="danger">{f.flagReason?.replaceAll('_', ' ').toLowerCase()}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
