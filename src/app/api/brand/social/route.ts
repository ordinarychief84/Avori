import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { socialPostSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = socialPostSchema.parse(await req.json());
    const maxSort = await prisma.socialPost.aggregate({
      where: { brandId },
      _max: { sort: true },
    });
    const post = await prisma.socialPost.create({
      data: {
        brandId,
        source: 'MANUAL',
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType ?? 'IMAGE',
        thumbnailUrl: data.thumbnailUrl || null,
        caption: data.caption || null,
        permalink: data.permalink || null,
        productIds: data.productIds ?? [],
        visible: data.visible ?? true,
        sort: data.sort ?? (maxSort._max.sort ?? -1) + 1,
        postedAt: new Date(),
      },
    });
    return ok({ post }, 201);
  } catch (e) {
    return fail(e);
  }
}
