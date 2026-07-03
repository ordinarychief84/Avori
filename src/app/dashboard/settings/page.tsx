import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { shopifyConfigured } from '@/lib/connectors/shopify';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/AppShell';
import EntityDialog from '@/components/EntityDialog';
import RowAction from '@/components/RowAction';
import RowDelete from '@/components/RowDelete';
import ApiKeyManager from '@/components/ApiKeyManager';
import ShopifyConnect from '@/components/ShopifyConnect';
import CopyField from '@/components/CopyField';
import { fmtDateTime } from '@/lib/format';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { shopify?: string };
}) {
  const { brandId, userId } = await pageBrandSession();
  const [brand, me, team, apiKeys, webhooks, integration, auditLogs] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { brandRole: true } }),
    prisma.user.findMany({
      where: { brandId },
      select: { id: true, email: true, name: true, brandRole: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.apiKey.findMany({ where: { brandId }, orderBy: { createdAt: 'desc' } }),
    prisma.webhookEndpoint.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { deliveries: true } } },
    }),
    prisma.integration.findFirst({ where: { brandId, provider: 'SHOPIFY' } }),
    prisma.auditLog.findMany({ where: { brandId }, orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);
  const isOwner = me?.brandRole === 'OWNER';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Workspace, team, integrations, API access and audit trail."
        actions={
          <EntityDialog
            title="Workspace profile"
            endpoint="/api/brand/settings"
            method="PATCH"
            triggerLabel="Edit workspace"
            triggerVariant="secondary"
            triggerIcon="pencil"
            initial={{ name: brand?.name ?? '', domain: brand?.domain ?? '', currency: brand?.currency ?? 'USD' }}
            fields={[
              { name: 'name', label: 'Store name', type: 'text', required: true },
              { name: 'domain', label: 'Primary domain', type: 'text', placeholder: 'shop.example.com' },
              { name: 'currency', label: 'Currency (ISO)', type: 'text', placeholder: 'USD' },
            ]}
          />
        }
      />

      {searchParams.shopify === 'connected' && (
        <Card className="border-success/40 bg-success/5">
          <CardBody className="text-sm text-fg">
            Shopify connected — the first sync is running in the background.
          </CardBody>
        </Card>
      )}
      {searchParams.shopify === 'error' && (
        <Card className="border-danger/40 bg-danger/5">
          <CardBody className="text-sm text-fg">Shopify connection failed. Check credentials and try again.</CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Shopify syncs products, customers and orders. WooCommerce, BigCommerce and Magento connectors follow the same
            architecture — custom platforms integrate today via the REST API below.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-2/40 p-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-fg">
                Shopify
                <Badge tone={integration?.status === 'CONNECTED' ? 'success' : 'neutral'}>
                  {integration?.status?.toLowerCase() ?? 'not connected'}
                </Badge>
              </div>
              <div className="mt-0.5 text-xs text-fg-muted">
                {integration?.shopDomain ?? 'No store linked yet'}
                {integration?.lastSyncAt && ` · last sync ${fmtDateTime(integration.lastSyncAt)}`}
              </div>
            </div>
            {integration?.status === 'CONNECTED' ? (
              <RowAction endpoint="/api/integrations/shopify/sync" method="POST" label="Sync now" successMessage="Sync complete" />
            ) : (
              <ShopifyConnect configured={shopifyConfigured()} />
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>API keys</CardTitle>
            <CardDescription>
              Authenticate the REST API (/api/v1/*) — orders, reviews, loyalty, quizzes, shade analysis and more.
            </CardDescription>
          </div>
          <ApiKeyManager />
        </CardHeader>
        <CardBody className="p-0">
          {apiKeys.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-fg-muted">No API keys yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.id} className="border-t border-border/60">
                    <td className="px-5 py-3 font-medium text-fg">{k.name}</td>
                    <td className="px-5 py-3 font-mono text-2xs text-fg-muted">{k.prefix}…</td>
                    <td className="px-5 py-3 text-xs text-fg-muted">
                      {k.revokedAt
                        ? `revoked ${fmtDateTime(k.revokedAt)}`
                        : k.lastUsedAt
                          ? `last used ${fmtDateTime(k.lastUsedAt)}`
                          : 'never used'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        {!k.revokedAt && (
                          <RowAction
                            endpoint={`/api/brand/apikeys/${k.id}`}
                            method="DELETE"
                            label="Revoke"
                            variant="danger"
                            successMessage="Key revoked"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>
              HMAC-signed events (order.created, review.approved, …) delivered to your endpoints with automatic retries.
            </CardDescription>
          </div>
          <EntityDialog
            title="Add webhook endpoint"
            endpoint="/api/brand/webhooks"
            triggerLabel="Add endpoint"
            triggerVariant="secondary"
            triggerSize="sm"
            fields={[
              { name: 'url', label: 'Endpoint URL', type: 'text', required: true, placeholder: 'https://example.com/webhooks/avori' },
              { name: 'topics', label: 'Topics', type: 'tags', placeholder: 'order.created, review.approved', hint: 'Leave empty to receive all topics' },
            ]}
          />
        </CardHeader>
        <CardBody className="p-0">
          {webhooks.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-fg-muted">No webhook endpoints yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {webhooks.map((w) => (
                  <tr key={w.id} className="border-t border-border/60">
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs text-fg">{w.url}</div>
                      <div className="mt-0.5 text-2xs text-fg-muted">
                        {w.topics.length > 0 ? w.topics.join(', ') : 'all topics'} · {w._count.deliveries} deliveries
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={w.active ? 'success' : 'neutral'}>{w.active ? 'active' : 'paused'}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <RowAction endpoint={`/api/brand/webhooks/${w.id}`} body={{ active: !w.active }} label={w.active ? 'Pause' : 'Resume'} />
                        <RowDelete endpoint={`/api/brand/webhooks/${w.id}`} confirm="Delete this endpoint?" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Team</CardTitle>
            <CardDescription>Owner manages billing, team and keys. Managers run modules. Staff moderate.</CardDescription>
          </div>
          {isOwner && (
            <EntityDialog
              title="Invite team member"
              description="Creates an account they can sign in with immediately."
              endpoint="/api/brand/team"
              triggerLabel="Invite member"
              triggerVariant="secondary"
              triggerSize="sm"
              fields={[
                { name: 'email', label: 'Email', type: 'text', required: true },
                { name: 'name', label: 'Name', type: 'text' },
                { name: 'password', label: 'Temporary password', type: 'text', required: true, hint: 'Share it with them securely' },
                {
                  name: 'brandRole',
                  label: 'Role',
                  type: 'select',
                  options: [
                    { value: 'MANAGER', label: 'Manager' },
                    { value: 'STAFF', label: 'Staff' },
                  ],
                },
              ]}
            />
          )}
        </CardHeader>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <tbody>
              {team.map((m) => (
                <tr key={m.id} className="border-t border-border/60">
                  <td className="px-5 py-3">
                    <div className="font-medium text-fg">{m.name ?? m.email}</div>
                    <div className="text-xs text-fg-muted">{m.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={m.brandRole === 'OWNER' ? 'accent' : 'neutral'}>{m.brandRole.toLowerCase()}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    {isOwner && m.id !== userId && (
                      <div className="flex justify-end gap-2">
                        <RowAction
                          endpoint={`/api/brand/team/${m.id}`}
                          body={{ brandRole: m.brandRole === 'MANAGER' ? 'STAFF' : 'MANAGER' }}
                          label={m.brandRole === 'MANAGER' ? 'Make staff' : 'Make manager'}
                        />
                        <RowDelete endpoint={`/api/brand/team/${m.id}`} confirm={`Remove ${m.email} from the team?`} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan & billing</CardTitle>
          <CardDescription>Stripe-ready subscription billing — plans gate module limits as you scale.</CardDescription>
        </CardHeader>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge tone="accent">{brand?.plan ?? 'FREE'}</Badge>
            <span className="text-sm text-fg-muted">
              All modules are included while Avori is in early access.
            </span>
          </div>
          <div className="text-xs text-fg-subtle">
            Workspace ID <CopyField value={brandId} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>Every sensitive action, recorded.</CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          {auditLogs.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-fg-muted">No activity yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {auditLogs.map((a) => (
                  <tr key={a.id} className="border-t border-border/60">
                    <td className="px-5 py-2.5 font-mono text-2xs text-accent">{a.action}</td>
                    <td className="px-5 py-2.5 text-xs text-fg-muted">
                      {a.entity}
                      {a.entityId ? ` · ${a.entityId.slice(0, 10)}…` : ''}
                    </td>
                    <td className="px-5 py-2.5 text-xs text-fg-muted">{a.userEmail ?? 'system'}</td>
                    <td className="px-5 py-2.5 text-right text-2xs text-fg-subtle">{fmtDateTime(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
