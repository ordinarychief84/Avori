import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { tagSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

async function assertVideoAndProductBelongToBrand(
  brandId: string,
  videoId: string,
  productId: string
) {
  const [video, product] = await Promise.all([
    prisma.video.findUnique({ where: { id: videoId } }),
    prisma.product.findUnique({ where: { id: productId } }),
  ]);
  if (!video || video.brandId !== brandId) throw new HttpError(404, 'Video not found');
  if (!product || product.brandId !== brandId) throw new HttpError(404, 'Product not found');
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const video = await prisma.video.findUnique({ where: { id: params.id } });
    if (!video || video.brandId !== brandId) throw new HttpError(404, 'Not found');
    const tags = await prisma.videoProductTag.findMany({
      where: { videoId: params.id },
      include: { product: true },
      orderBy: { startTime: 'asc' },
    });
    return ok({ tags });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = tagSchema.parse(await req.json());
    if (data.endTime <= data.startTime) {
      throw new HttpError(400, 'endTime must be greater than startTime');
    }
    await assertVideoAndProductBelongToBrand(brandId, params.id, data.productId);
    const tag = await prisma.videoProductTag.create({
      data: {
        videoId: params.id,
        productId: data.productId,
        x: data.x,
        y: data.y,
        startTime: data.startTime,
        endTime: data.endTime,
      },
      include: { product: true },
    });
    return ok({ tag }, 201);
  } catch (e) {
    return fail(e);
  }
}
