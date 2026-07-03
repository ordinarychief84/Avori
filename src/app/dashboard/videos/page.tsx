import Link from 'next/link';
import { Plus, Film, Tag, Eye, MousePointerClick } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/AppShell';
import RowDelete from '@/components/RowDelete';
import EntityDialog from '@/components/EntityDialog';

export default async function VideosPage() {
  const { brandId } = await pageBrandSession();
  const [videos, products, eventAgg] = await Promise.all([
    prisma.video.findMany({
      where: { brandId },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { tags: true } } },
    }),
    prisma.product.findMany({
      where: { brandId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ['videoId', 'type'],
      where: { brandId, videoId: { not: null }, type: { in: ['VIEW', 'TAG_CLICK'] } },
      _count: true,
    }),
  ]);

  const stats = new Map<string, { views: number; taps: number }>();
  for (const row of eventAgg) {
    if (!row.videoId) continue;
    const entry = stats.get(row.videoId) ?? { views: 0, taps: 0 };
    if (row.type === 'VIEW') entry.views += row._count;
    if (row.type === 'TAG_CLICK') entry.taps += row._count;
    stats.set(row.videoId, entry);
  }
  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Shoppable Videos"
        description="Tag products in vertical clips, target them at product pages, and track every view to revenue."
        actions={
          <Link href="/dashboard/videos/upload">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Upload video</Button>
          </Link>
        }
      />

      {videos.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No videos yet"
          description="Drag and drop a vertical MP4. It's ready to tag in a few seconds."
          action={
            <Link href="/dashboard/videos/upload">
              <Button leftIcon={<Plus className="h-4 w-4" />}>Upload your first video</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((v) => {
            const statusTone = v.disabled
              ? 'danger'
              : v.status === 'ACTIVE'
                ? 'success'
                : v.status === 'DRAFT'
                  ? 'warning'
                  : 'neutral';
            const st = stats.get(v.id) ?? { views: 0, taps: 0 };
            const ctr = st.views > 0 ? Math.round((st.taps / st.views) * 100) : 0;
            return (
              <Card key={v.id} className="overflow-hidden">
                <div className="relative aspect-[9/16] max-h-72 bg-bg">
                  {v.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover opacity-90"
                    />
                  ) : (
                    <video
                      src={v.videoUrl}
                      className="h-full w-full object-cover opacity-90"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}
                  <div className="absolute inset-x-3 top-3 flex justify-between">
                    <Badge tone={statusTone as 'success' | 'warning' | 'neutral' | 'danger'}>
                      {v.disabled ? 'disabled' : v.status.toLowerCase()}
                    </Badge>
                    <Badge tone="neutral">
                      <Tag className="h-2.5 w-2.5" />
                      {v._count.tags}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <div className="font-medium text-fg">{v.title}</div>
                    <div className="mt-1 text-2xs text-fg-subtle">
                      {v.targetProductIds.length === 0
                        ? 'Shown on all pages'
                        : `Targeted at ${v.targetProductIds.length} product page${v.targetProductIds.length > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-surface-2/40 p-2 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-2xs text-fg-subtle">
                        <Eye className="h-3 w-3" /> Views
                      </div>
                      <div className="text-sm font-semibold text-fg">{st.views}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-2xs text-fg-subtle">
                        <MousePointerClick className="h-3 w-3" /> Taps
                      </div>
                      <div className="text-sm font-semibold text-fg">{st.taps}</div>
                    </div>
                    <div>
                      <div className="text-2xs text-fg-subtle">CTR</div>
                      <div className="text-sm font-semibold text-fg">{ctr}%</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/videos/${v.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        Edit & tag
                      </Button>
                    </Link>
                    <EntityDialog
                      title="Placement & order"
                      description="Choose which product pages this video appears on. Empty means every page. Lower sort numbers play first."
                      endpoint={`/api/brand/videos/${v.id}`}
                      method="PATCH"
                      triggerLabel="Placement"
                      triggerVariant="secondary"
                      triggerSize="sm"
                      triggerIcon="none"
                      initial={{ targetProductIds: v.targetProductIds, sort: v.sort }}
                      fields={[
                        {
                          name: 'targetProductIds',
                          label: 'Show on these product pages',
                          type: 'multiselect',
                          options: productOptions,
                          hint: 'Leave empty to show everywhere',
                        },
                        { name: 'sort', label: 'Playlist order', type: 'number', min: 0 },
                      ]}
                    />
                    <RowDelete
                      endpoint={`/api/brand/videos/${v.id}`}
                      confirm={`Delete "${v.title}" and all its tags?`}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
