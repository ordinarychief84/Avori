import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { videoPatchSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

async function ownVideo(brandId: string, id: string) {
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video || video.brandId !== brandId) throw new HttpError(404, 'Not found');
  return video;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    await ownVideo(brandId, params.id);
    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        tags: { include: { product: true }, orderBy: { startTime: 'asc' } },
      },
    });
    return ok({ video });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    await ownVideo(brandId, params.id);
    const data = videoPatchSchema.parse(await req.json());
    const video = await prisma.video.update({
      where: { id: params.id },
      data: {
        ...data,
        description: data.description === '' ? null : data.description,
        thumbnailUrl: data.thumbnailUrl === '' ? null : data.thumbnailUrl,
      },
    });
    return ok({ video });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    await ownVideo(brandId, params.id);
    await prisma.video.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
