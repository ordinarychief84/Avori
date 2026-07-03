import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { fail, ok } from '@/lib/http';

export async function GET(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const url = new URL(req.url);
    const rawLimit = Number(url.searchParams.get('limit') ?? 100);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 100;
    const cursor = url.searchParams.get('cursor') || undefined;
    const products = await prisma.product.findMany({
      where: { brandId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        productUrl: true,
        sku: true,
        reviewsCount: true,
        ratingAvg: true,
        aiReviewSummary: true,
      },
    });
    const hasMore = products.length > limit;
    const page = hasMore ? products.slice(0, limit) : products;
    return ok({ products: page, nextCursor: hasMore ? page[page.length - 1].id : null });
  } catch (e) {
    return fail(e);
  }
}
