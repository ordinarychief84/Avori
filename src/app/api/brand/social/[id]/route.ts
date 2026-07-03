import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { socialPostPatchSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = socialPostPatchSchema.parse(await req.json());
    const existing = await prisma.socialPost.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Post not found');
    const post = await prisma.socialPost.update({
      where: { id: existing.id },
      data: {
        ...(data.mediaUrl !== undefined ? { mediaUrl: data.mediaUrl } : {}),
        ...(data.mediaType !== undefined ? { mediaType: data.mediaType } : {}),
        ...(data.thumbnailUrl !== undefined ? { thumbnailUrl: data.thumbnailUrl || null } : {}),
        ...(data.caption !== undefined ? { caption: data.caption || null } : {}),
        ...(data.permalink !== undefined ? { permalink: data.permalink || null } : {}),
        ...(data.productIds !== undefined ? { productIds: data.productIds } : {}),
        ...(data.visible !== undefined ? { visible: data.visible } : {}),
        ...(data.sort !== undefined ? { sort: data.sort } : {}),
      },
    });
    return ok({ post });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.socialPost.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Post not found');
    await prisma.socialPost.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
