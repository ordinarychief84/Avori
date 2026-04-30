import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { videoSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function GET() {
  try {
    const { brandId } = await requireBrand();
    const videos = await prisma.video.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tags: true } } },
    });
    return ok({ videos });
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
