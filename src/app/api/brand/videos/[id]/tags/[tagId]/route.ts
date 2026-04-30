import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { tagPatchSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

async function ownTag(brandId: string, videoId: string, tagId: string) {
  const tag = await prisma.videoProductTag.findUnique({
    where: { id: tagId },
    include: { video: true },
  });
  if (!tag || tag.videoId !== videoId || tag.video.brandId !== brandId) {
    throw new HttpError(404, 'Not found');
  }
  return tag;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; tagId: string } }
) {
  try {
    const { brandId } = await requireBrand();
    await ownTag(brandId, params.id, params.tagId);
    const data = tagPatchSchema.parse(await req.json());
    if (
      data.startTime !== undefined &&
      data.endTime !== undefined &&
      data.endTime <= data.startTime
    ) {
      throw new HttpError(400, 'endTime must be greater than startTime');
    }
    const tag = await prisma.videoProductTag.update({
      where: { id: params.tagId },
      data,
      include: { product: true },
    });
    return ok({ tag });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string; tagId: string } }
) {
  try {
    const { brandId } = await requireBrand();
    await ownTag(brandId, params.id, params.tagId);
    await prisma.videoProductTag.delete({ where: { id: params.tagId } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
