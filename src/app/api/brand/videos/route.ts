import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { videoSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function GET(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const url = new URL(req.url);
    const rawLimit = Number(url.searchParams.get('limit') ?? 100);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 100;
    const cursor = url.searchParams.get('cursor') || undefined;
    const videos = await prisma.video.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tags: true } } },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = videos.length > limit;
    const page = hasMore ? videos.slice(0, limit) : videos;
    const nextCursor = hasMore ? page[page.length - 1].id : null;
    return ok({ videos: page, nextCursor });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = videoSchema.parse(await req.json());
    const video = await prisma.video.create({
      data: {
        brandId,
        title: data.title,
        description: data.description || null,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl || null,
        status: data.status,
        durationSec: data.durationSec ?? null,
      },
    });
    return ok({ video }, 201);
  } catch (e) {
    return fail(e);
  }
}
