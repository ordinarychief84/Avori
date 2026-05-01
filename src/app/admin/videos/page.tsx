import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/AppShell';
import ToggleDisabled from '@/components/ToggleDisabled';

export default async function AdminVideosPage() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    include: { brand: { select: { id: true, name: true } } },
    take: 200,
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Videos" description={`Latest ${videos.length} across all brands.`} />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/40 text-left text-2xs uppercase tracking-wide text-fg-subtle">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Brand</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.id} className="border-b border-border/60 last:border-0">
                <td className="px-5 py-3 text-fg">{v.title}</td>
                <td className="px-5 py-3 text-fg-muted">{v.brand.name}</td>
                <td className="px-5 py-3">
                  <Badge
                    tone={
                      v.disabled
                        ? 'danger'
                        : v.status === 'ACTIVE'
                          ? 'success'
                          : v.status === 'DRAFT'
                            ? 'warning'
                            : 'neutral'
                    }
                  >
                    {v.disabled ? 'disabled' : v.status.toLowerCase()}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-right">
                  <ToggleDisabled
                    endpoint={`/api/admin/videos/${v.id}`}
                    disabled={v.disabled}
                    label={v.disabled ? 'Enable' : 'Disable'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
