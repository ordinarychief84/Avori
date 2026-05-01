import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/AppShell';
import EmbedSnippet from '@/components/EmbedSnippet';
import { Globe } from 'lucide-react';

export default async function EmbedPage() {
  const session = await auth();
  const brandId = session!.user.brandId!;
  const [brand, installs] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId } }),
    prisma.widgetInstall.findMany({
      where: { brandId },
      orderBy: { lastSeenAt: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Embed"
        description={`Paste this snippet anywhere on your website. The widget will load active videos for ${brand?.name}.`}
      />

      <Card>
        <CardBody>
          <EmbedSnippet brandId={brandId} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detected installs</CardTitle>
          <p className="mt-1 text-sm text-fg-muted">
            Each domain that loads your widget is recorded automatically.
          </p>
        </CardHeader>
        <CardBody>
          {installs.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No installs detected yet"
              description="Once your widget loads on a customer-facing page, the domain will show up here."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-2xs uppercase tracking-wide text-fg-subtle">
                  <th className="py-2 font-normal">Domain</th>
                  <th className="py-2 font-normal">Mode</th>
                  <th className="py-2 font-normal">First seen</th>
                  <th className="py-2 font-normal">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {installs.map((i) => (
                  <tr key={i.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 font-mono text-2xs text-fg">{i.domain}</td>
                    <td className="py-2.5 text-fg-muted">{i.mode}</td>
                    <td className="py-2.5 text-fg-muted">
                      {i.firstSeenAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="py-2.5 text-fg-muted">
                      {i.lastSeenAt.toISOString().slice(0, 16).replace('T', ' ')}
                    </td>
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
