import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { ugcItemSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = ugcItemSchema.parse(await req.json());
    const maxSort = await prisma.ugcItem.aggregate({
      where: { brandId },
      _max: { sort: true },
    });
    const item = await prisma.ugcItem.create({
      data: {
        brandId,
        source: 'UPLOAD',
        // Merchant-added content is curated by definition, publish it directly
        // unless they picked a status themselves.
        status: data.status ?? 'APPROVED',
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType ?? 'IMAGE',
        thumbnailUrl: data.thumbnailUrl || null,
        caption: data.caption || null,
        creditName: data.creditName || null,
        productIds: data.productIds ?? [],
        sort: data.sort ?? (maxSort._max.sort ?? -1) + 1,
      },
    });
    return ok({ item }, 201);
  } catch (e) {
    return fail(e);
  }
}
