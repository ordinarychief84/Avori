import { Camera } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/AppShell';
import EntityDialog, { type FieldSpec } from '@/components/EntityDialog';
import RowAction from '@/components/RowAction';
import RowDelete from '@/components/RowDelete';

const STATUS_TONE = { APPROVED: 'success', PENDING: 'warning', HIDDEN: 'neutral' } as const;

export default async function UgcPage() {
  const { brandId } = await pageBrandSession();
  const [items, products, pendingCount] = await Promise.all([
    prisma.ugcItem.findMany({
      where: { brandId },
      orderBy: [{ status: 'asc' }, { sort: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.product.findMany({
      where: { brandId, status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.ugcItem.count({ where: { brandId, status: 'PENDING' } }),
  ]);
  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

  const itemFields: FieldSpec[] = [
    { name: 'mediaUrl', label: 'Media URL', type: 'text', required: true, placeholder: 'https://… or /uploads/…', hint: 'Paste an image/video URL or upload via Products → uploader' },
    {
      name: 'mediaType',
      label: 'Media type',
      type: 'select',
      options: [
        { value: 'IMAGE', label: 'Image' },
        { value: 'VIDEO', label: 'Video' },
      ],
    },
    { name: 'caption', label: 'Caption', type: 'textarea' },
    { name: 'creditName', label: 'Credit', type: 'text', placeholder: 'Amara O. or @handle' },
    { name: 'productIds', label: 'Tagged products', type: 'multiselect', options: productOptions },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'APPROVED', label: 'Approved, live in the gallery' },
        { value: 'PENDING', label: 'Pending review' },
        { value: 'HIDDEN', label: 'Hidden' },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="UGC Gallery"
        description={`Customer photos and videos, curated into a shoppable wall. Approved review media lands here automatically as pending.${pendingCount > 0 ? ` ${pendingCount} item${pendingCount === 1 ? '' : 's'} waiting for approval.` : ''}`}
        actions={
          <>
            <RowAction
              endpoint="/api/brand/ugc/import-reviews"
              method="POST"
              label="Import from reviews"
              successMessage="Review media imported"
            />
            <EntityDialog title="Add UGC" endpoint="/api/brand/ugc" triggerLabel="Add UGC" wide fields={itemFields} />
          </>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No UGC yet"
          description="Approve reviews with photos or videos, import them here, tag products, and the gallery goes live through the widget (data-mode=&quot;gallery&quot;), the SDK, and GET /api/v1/ugc."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((i) => (
            <Card key={i.id} className="overflow-hidden">
              <div className="relative aspect-square bg-surface-2">
                {i.mediaType === 'VIDEO' ? (
                  <video src={i.mediaUrl} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.mediaUrl} alt="" className="h-full w-full object-cover" />
                )}
                <div className="absolute left-2 top-2 flex gap-1">
                  <Badge tone={STATUS_TONE[i.status]}>{i.status.toLowerCase()}</Badge>
                </div>
              </div>
              <div className="space-y-2 p-4">
                {i.caption && <p className="line-clamp-2 text-sm text-fg-muted">{i.caption}</p>}
                <div className="text-xs text-fg-subtle">
                  {i.creditName ? `${i.creditName} · ` : ''}
                  {i.productIds.length} tagged product{i.productIds.length === 1 ? '' : 's'} · from{' '}
                  {i.source.toLowerCase()}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {i.status !== 'APPROVED' && (
                    <RowAction endpoint={`/api/brand/ugc/${i.id}`} body={{ status: 'APPROVED' }} label="Approve" />
                  )}
                  {i.status === 'APPROVED' && (
                    <RowAction endpoint={`/api/brand/ugc/${i.id}`} body={{ status: 'HIDDEN' }} label="Hide" />
                  )}
                  <EntityDialog
                    title="Edit UGC"
                    endpoint={`/api/brand/ugc/${i.id}`}
                    method="PATCH"
                    triggerLabel="Edit"
                    triggerVariant="secondary"
                    triggerSize="sm"
                    triggerIcon="none"
                    wide
                    initial={{
                      mediaUrl: i.mediaUrl,
                      mediaType: i.mediaType,
                      caption: i.caption ?? '',
                      creditName: i.creditName ?? '',
                      productIds: i.productIds,
                      status: i.status,
                    }}
                    fields={itemFields}
                  />
                  <RowDelete endpoint={`/api/brand/ugc/${i.id}`} confirm="Remove this UGC item?" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
