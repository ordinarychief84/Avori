import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import VideoTagEditor from '@/components/VideoTagEditor';

export default async function VideoEditPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const brandId = session!.user.brandId!;
  const [video, products] = await Promise.all([
    prisma.video.findUnique({
      where: { id: params.id },
      include: {
        tags: {
          include: { product: true },
          orderBy: { startTime: 'asc' },
        },
      },
    }),
    prisma.product.findMany({
      where: { brandId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  if (!video || video.brandId !== brandId) notFound();

  return (
    <VideoTagEditor
      video={{
        id: video.id,
        title: video.title,
        description: video.description ?? '',
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl ?? '',
        status: video.status,
        tags: video.tags.map((t) => ({
          id: t.id,
          productId: t.productId,
          x: t.x,
          y: t.y,
          startTime: t.startTime,
          endTime: t.endTime,
          product: {
            id: t.product.id,
            name: t.product.name,
            imageUrl: t.product.imageUrl,
          },
        })),
      }}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        price: Number(p.price),
      }))}
    />
  );
}
