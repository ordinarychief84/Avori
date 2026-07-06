import Link from 'next/link';
import { Crown } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/AppShell';
import EntityDialog from '@/components/EntityDialog';
import RowDelete from '@/components/RowDelete';
import { fmtMoney, customerName } from '@/lib/format';

export default async function LoyaltyPage() {
  const { brandId } = await pageBrandSession();

  const program = await prisma.loyaltyProgram.upsert({
    where: { brandId },
    update: {},
    create: { brandId },
    include: { tiers: { orderBy: { minPoints: 'asc' } } },
  });

  const [rewards, members, issued, redeemed] = await Promise.all([
    prisma.reward.findMany({ where: { brandId }, orderBy: { pointsCost: 'asc' } }),
    prisma.loyaltyMember.findMany({
      where: { brandId },
      orderBy: { points: 'desc' },
      take: 25,
      include: { customer: true, tier: true },
    }),
    prisma.pointsTransaction.aggregate({
      where: { brandId, points: { gt: 0 } },
      _sum: { points: true },
    }),
    prisma.pointsTransaction.aggregate({
      where: { brandId, points: { lt: 0 } },
      _sum: { points: true },
    }),
  ]);

  const programFields = [
    { name: 'enabled', label: 'Program', type: 'toggle' as const, placeholder: 'Loyalty program enabled' },
    { name: 'pointsName', label: 'Points name', type: 'text' as const, placeholder: 'Points' },
    { name: 'earnRate', label: 'Earn rate (points per $1 spent)', type: 'number' as const, step: '0.1' },
    { name: 'cashbackPct', label: 'Cashback (% of each order as store credit)', type: 'number' as const, step: '0.5', hint: '0 turns cashback off' },
    { name: 'redeemRate', label: 'Redeem rate (points per $1 off)', type: 'number' as const },
    { name: 'signupBonus', label: 'Signup bonus', type: 'number' as const },
    { name: 'reviewBonus', label: 'Approved review bonus', type: 'number' as const },
    { name: 'birthdayBonus', label: 'Birthday bonus', type: 'number' as const },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Loyalty & Rewards"
        description="Points, VIP tiers, and a rewards catalog customers redeem against."
        actions={
          <EntityDialog
            title="Program settings"
            endpoint="/api/brand/loyalty/program"
            method="PATCH"
            triggerLabel="Program settings"
            triggerVariant="secondary"
            triggerIcon="none"
            initial={{
              enabled: program.enabled,
              pointsName: program.pointsName,
              earnRate: Number(program.earnRate),
              cashbackPct: Number(program.cashbackPct),
              redeemRate: program.redeemRate,
              signupBonus: program.signupBonus,
              reviewBonus: program.reviewBonus,
              birthdayBonus: program.birthdayBonus,
            }}
            fields={programFields}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Status" value={program.enabled ? 'Active' : 'Off'} sub={program.enabled ? `${Number(program.earnRate)} pts per $1` : 'Enable in program settings'} />
        <Stat label="Members" value={members.length} />
        <Stat label="Points issued" value={issued._sum.points ?? 0} />
        <Stat label="Points redeemed" value={Math.abs(redeemed._sum.points ?? 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>VIP tiers</CardTitle>
            <EntityDialog
              title="Add tier"
              endpoint="/api/brand/loyalty/tiers"
              triggerLabel="Add tier"
              triggerSize="sm"
              triggerVariant="secondary"
              fields={[
                { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Gold' },
                { name: 'minPoints', label: 'Lifetime points to enter', type: 'number', required: true },
                { name: 'multiplier', label: 'Earn multiplier', type: 'number', step: '0.1', required: true },
                { name: 'perks', label: 'Perks (shown to customers)', type: 'textarea' },
              ]}
            />
          </CardHeader>
          <CardBody className="p-0">
            {program.tiers.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-fg-muted">
                No tiers yet, members earn at the base rate.
              </p>
            ) : (
              <div className="-mx-px overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
                <tbody>
                  {program.tiers.map((t) => (
                    <tr key={t.id} className="border-t border-border/60">
                      <td className="px-5 py-3">
                        <div className="font-medium text-fg">{t.name}</div>
                        <div className="text-xs text-fg-muted">{t.perks ?? ''}</div>
                      </td>
                      <td className="px-5 py-3 text-fg-muted">{t.minPoints}+ pts</td>
                      <td className="px-5 py-3 text-fg-muted">{Number(t.multiplier)}×</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <EntityDialog
                            title="Edit tier"
                            endpoint={`/api/brand/loyalty/tiers/${t.id}`}
                            method="PATCH"
                            triggerLabel="Edit"
                            triggerVariant="secondary"
                            triggerSize="sm"
                            triggerIcon="none"
                            initial={{ name: t.name, minPoints: t.minPoints, multiplier: Number(t.multiplier), perks: t.perks ?? '' }}
                            fields={[
                              { name: 'name', label: 'Name', type: 'text', required: true },
                              { name: 'minPoints', label: 'Lifetime points to enter', type: 'number', required: true },
                              { name: 'multiplier', label: 'Earn multiplier', type: 'number', step: '0.1', required: true },
                              { name: 'perks', label: 'Perks', type: 'textarea' },
                            ]}
                          />
                          <RowDelete endpoint={`/api/brand/loyalty/tiers/${t.id}`} confirm={`Delete tier ${t.name}?`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Rewards catalog</CardTitle>
            <EntityDialog
              title="Add reward"
              endpoint="/api/brand/loyalty/rewards"
              triggerLabel="Add reward"
              triggerSize="sm"
              triggerVariant="secondary"
              fields={[
                { name: 'name', label: 'Name', type: 'text', required: true, placeholder: '$10 off' },
                {
                  name: 'type',
                  label: 'Type',
                  type: 'select',
                  options: [
                    { value: 'DISCOUNT_FIXED', label: 'Fixed discount' },
                    { value: 'DISCOUNT_PERCENT', label: 'Percentage discount' },
                    { value: 'STORE_CREDIT', label: 'Store credit' },
                    { value: 'FREE_SHIPPING', label: 'Free shipping' },
                    { value: 'FREE_PRODUCT', label: 'Free product' },
                  ],
                },
                { name: 'pointsCost', label: 'Points cost', type: 'number', required: true },
                { name: 'value', label: 'Value ($ or %)', type: 'number', step: '0.01' },
              ]}
            />
          </CardHeader>
          <CardBody className="p-0">
            {rewards.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-fg-muted">No rewards yet, add what points redeem for.</p>
            ) : (
              <div className="-mx-px overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
                <tbody>
                  {rewards.map((r) => (
                    <tr key={r.id} className="border-t border-border/60">
                      <td className="px-5 py-3">
                        <div className="font-medium text-fg">{r.name}</div>
                        <div className="text-xs text-fg-muted">{r.type.replaceAll('_', ' ').toLowerCase()}</div>
                      </td>
                      <td className="px-5 py-3 text-fg-muted">{r.pointsCost} pts</td>
                      <td className="px-5 py-3">
                        <Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'active' : 'off'}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <EntityDialog
                            title="Edit reward"
                            endpoint={`/api/brand/loyalty/rewards/${r.id}`}
                            method="PATCH"
                            triggerLabel="Edit"
                            triggerVariant="secondary"
                            triggerSize="sm"
                            triggerIcon="none"
                            initial={{ name: r.name, type: r.type, pointsCost: r.pointsCost, value: Number(r.value), active: r.active }}
                            fields={[
                              { name: 'name', label: 'Name', type: 'text', required: true },
                              {
                                name: 'type',
                                label: 'Type',
                                type: 'select',
                                options: [
                                  { value: 'DISCOUNT_FIXED', label: 'Fixed discount' },
                                  { value: 'DISCOUNT_PERCENT', label: 'Percentage discount' },
                                  { value: 'STORE_CREDIT', label: 'Store credit' },
                                  { value: 'FREE_SHIPPING', label: 'Free shipping' },
                                  { value: 'FREE_PRODUCT', label: 'Free product' },
                                ],
                              },
                              { name: 'pointsCost', label: 'Points cost', type: 'number', required: true },
                              { name: 'value', label: 'Value', type: 'number', step: '0.01' },
                              { name: 'active', label: 'Active', type: 'toggle' },
                            ]}
                          />
                          <RowDelete endpoint={`/api/brand/loyalty/rewards/${r.id}`} confirm={`Delete reward ${r.name}?`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top members</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {members.length === 0 ? (
            <div className="px-5 pb-6">
              <EmptyState
                icon={Crown}
                title="No members yet"
                description="Customers join automatically when they earn their first points from an order."
              />
            </div>
          ) : (
            <div className="-mx-px overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-[0.15em] text-fg-subtle">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Balance</th>
                  <th className="px-5 py-3">Lifetime</th>
                  <th className="px-5 py-3">Tier</th>
                  <th className="px-5 py-3">Spend</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/customers/${m.customerId}`} className="font-medium text-fg hover:text-accent">
                        {customerName(m.customer)}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-fg">{m.points}</td>
                    <td className="px-5 py-3 text-fg-muted">{m.lifetimePoints}</td>
                    <td className="px-5 py-3 text-fg-muted">{m.tier?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-fg-muted">{fmtMoney(m.customer.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
