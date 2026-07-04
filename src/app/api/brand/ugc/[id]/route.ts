import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { ugcItemPatchSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = ugcItemPatchSchema.parse(await req.json());
    const existing = await prisma.ugcItem.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'UGC item not found');

    const item = await prisma.ugcItem.update({
      where: { id: existing.id },
      data: {
        ...(data.mediaUrl !== undefined ? { mediaUrl: data.mediaUrl } : {}),
        ...(data.mediaType !== undefined ? { mediaType: data.mediaType } : {}),
        ...(data.thumbnailUrl !== undefined ? { thumbnailUrl: data.thumbnailUrl || null } : {}),
        ...(data.caption !== undefined ? { caption: data.caption || null } : {}),
        ...(data.creditName !== undefined ? { creditName: data.creditName || null } : {}),
        ...(data.productIds !== undefined ? { productIds: data.productIds } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.sort !== undefined ? { sort: data.sort } : {}),
      },
    });
    return ok({ item });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.ugcItem.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'UGC item not found');
    await prisma.ugcItem.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
