import { Instagram } from 'lucide-react';
import { pageBrandSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/AppShell';
import EntityDialog, { type FieldSpec } from '@/components/EntityDialog';
import RowAction from '@/components/RowAction';
import RowDelete from '@/components/RowDelete';

export default async function SocialPage() {
  const { brandId } = await pageBrandSession();
  const [posts, products] = await Promise.all([
    prisma.socialPost.findMany({
      where: { brandId },
      orderBy: [{ sort: 'asc' }, { postedAt: 'desc' }],
    }),
    prisma.product.findMany({
      where: { brandId, status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

  const postFields: FieldSpec[] = [
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
    { name: 'permalink', label: 'Original post URL', type: 'text', placeholder: 'https://instagram.com/p/…' },
    { name: 'productIds', label: 'Tagged products', type: 'multiselect', options: productOptions },
    { name: 'visible', label: 'Visibility', type: 'toggle', placeholder: 'Show in storefront gallery' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Instagram & Social Feed"
        description="A shoppable gallery for your storefront. Add posts manually now; connect Instagram sync from Settings → Integrations when ready."
        actions={
          <EntityDialog title="Add post" endpoint="/api/brand/social" triggerLabel="Add post" wide fields={postFields} />
        }
      />

      {posts.length === 0 ? (
        <EmptyState
          icon={Instagram}
          title="No posts yet"
          description="Curate UGC and social content, tag products, and serve the gallery from GET /api/v1/social."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="relative aspect-square bg-surface-2">
                {p.mediaType === 'VIDEO' ? (
                  <video src={p.mediaUrl} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.mediaUrl} alt="" className="h-full w-full object-cover" />
                )}
                {!p.visible && (
                  <div className="absolute left-2 top-2">
                    <Badge tone="warning">hidden</Badge>
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                {p.caption && <p className="line-clamp-2 text-sm text-fg-muted">{p.caption}</p>}
                <div className="text-xs text-fg-subtle">
                  {p.productIds.length} tagged product{p.productIds.length === 1 ? '' : 's'} · {p.source.toLowerCase()}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <EntityDialog
                    title="Edit post"
                    endpoint={`/api/brand/social/${p.id}`}
                    method="PATCH"
                    triggerLabel="Edit"
                    triggerVariant="secondary"
                    triggerSize="sm"
                    triggerIcon="none"
                    wide
                    initial={{
                      mediaUrl: p.mediaUrl,
                      mediaType: p.mediaType,
                      caption: p.caption ?? '',
                      permalink: p.permalink ?? '',
                      productIds: p.productIds,
                      visible: p.visible,
                    }}
                    fields={postFields}
                  />
                  <RowAction
                    endpoint={`/api/brand/social/${p.id}`}
                    body={{ visible: !p.visible }}
                    label={p.visible ? 'Hide' : 'Show'}
                  />
                  <RowDelete endpoint={`/api/brand/social/${p.id}`} confirm="Remove this post?" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
