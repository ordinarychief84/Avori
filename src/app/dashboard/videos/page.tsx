import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DeleteButton from '@/components/DeleteButton';

export default async function VideosPage() {
  const session = await auth();
  const brandId = session!.user.brandId!;
  const videos = await prisma.video.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { tags: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Videos</h1>
        <Link href="/dashboard/videos/upload" className="btn-primary">
          Upload video
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="card p-10 text-center text-zinc-600">
          No videos yet.{' '}
          <Link className="text-brand-600 hover:underline" href="/dashboard/videos/upload">
            Upload one.
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <div key={v.id} className="card overflow-hidden">
              <div className="relative aspect-[9/16] bg-zinc-900">
                {v.thumbnailUrl ? (
                  <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <video
                    src={v.videoUrl}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                )}
                <span
                  className={
                    'absolute right-2 top-2 ' +
                    (v.disabled
                      ? 'badge bg-red-100 text-red-700'
                      : v.status === 'ACTIVE'
                        ? 'badge bg-green-100 text-green-700'
                        : v.status === 'DRAFT'
                          ? 'badge bg-amber-100 text-amber-700'
                          : 'badge bg-zinc-100 text-zinc-600')
                  }
                >
                  {v.disabled ? 'disabled' : v.status.toLowerCase()}
                </span>
              </div>
              <div className="p-4">
                <div className="font-medium">{v.title}</div>
                <div className="mt-1 text-xs text-zinc-500">{v._count.tags} tag(s)</div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/dashboard/videos/${v.id}`} className="btn-secondary flex-1">
                    Edit & tag
                  </Link>
                  <DeleteButton endpoint={`/api/brand/videos/${v.id}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
