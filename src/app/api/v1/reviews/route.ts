import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { HttpError } from '@/lib/auth';
import { reviewSubmitSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { submitReview } from '@/lib/reviews';

export async function GET(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');
    if (!productId) throw new HttpError(400, 'productId query parameter required');

    const [product, reviews] = await Promise.all([
      prisma.product.findFirst({
        where: { id: productId, brandId },
        select: { reviewsCount: true, ratingAvg: true, aiReviewSummary: true },
      }),
      prisma.review.findMany({
        where: { brandId, productId, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          authorName: true,
          verified: true,
          mediaUrls: true,
          helpfulCount: true,
          reply: true,
          createdAt: true,
        },
      }),
    ]);
    if (!product) throw new HttpError(404, 'Product not found');
    return ok({
      summary: {
        count: product.reviewsCount,
        ratingAvg: product.ratingAvg !== null ? Number(product.ratingAvg) : null,
        aiSummary: product.aiReviewSummary,
      },
      reviews,
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const data = reviewSubmitSchema.parse(await req.json());
    const review = await submitReview(brandId, {
      ...data,
      authorEmail: data.authorEmail || undefined,
      title: data.title || undefined,
    });
    return ok({ review: { id: review.id, status: review.status, verified: review.verified } }, 201);
  } catch (e) {
    return fail(e);
  }
}
