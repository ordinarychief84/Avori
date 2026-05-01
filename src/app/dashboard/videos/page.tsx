import Link from 'next/link';
import { Plus, Film, Tag } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/AppShell';
import RowDelete from '@/components/RowDelete';

export default async function VideosPage() {
  const session = await auth();
  const brandId = session!.user.brandId!;
  const videos = await prisma.video.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { tags: true } } },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Videos"
        description="Vertical clips brands tag and embed."
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
          description="Drag and drop a vertical MP4. We'll get it ready to tag in a few seconds."
          action={
            <Link href="/dashboard/videos/upload">
              <Button leftIcon={<Plus className="h-4 w-4" />}>Upload your first video</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((v) => {
            const statusTone =
              v.disabled
                ? 'danger'
                : v.status === 'ACTIVE'
                  ? 'success'
                  : v.status === 'DRAFT'
                    ? 'warning'
                    : 'neutral';
            return (
              <Card key={v.id} className="overflow-hidden">
                <div className="relative aspect-[9/16] bg-bg">
                  {v.thumbnailUrl ? (
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
                    {v.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{v.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/videos/${v.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full">
                        Edit & tag
                      </Button>
                    </Link>
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
