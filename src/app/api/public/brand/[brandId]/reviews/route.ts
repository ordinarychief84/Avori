import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { reviewSubmitSchema } from '@/lib/validation';
import { submitReview } from '@/lib/reviews';

// Public reviews for the storefront widget: approved reviews + product
// rating summary + published Q&A.
export async function GET(req: NextRequest, { params }: { params: { brandId: string } }) {
  try {
    const ip = clientIp(req);
    const { ok: allowed } = rateLimit(`reviews:${ip}`, 600);
    if (!allowed) return fail(new Error('Rate limited'));

    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');
    if (!productId) return ok({ reviews: [], summary: null });

    const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
    if (!brand || brand.disabled) return ok({ reviews: [], summary: null });

    const [product, reviews, questions] = await Promise.all([
      prisma.product.findFirst({
        where: { id: productId, brandId: brand.id, status: 'ACTIVE' },
        select: { reviewsCount: true, ratingAvg: true, aiReviewSummary: true },
      }),
      prisma.review.findMany({
        where: { brandId: brand.id, productId, status: 'APPROVED' },
        orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
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
      prisma.productQuestion.findMany({
        where: { brandId: brand.id, productId, status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, body: true, authorName: true, answer: true, answeredAt: true },
      }),
    ]);
    if (!product) return ok({ reviews: [], summary: null });

    return ok({
      summary: {
        count: product.reviewsCount,
        ratingAvg: product.ratingAvg !== null ? Number(product.ratingAvg) : null,
        aiSummary: product.aiReviewSummary,
      },
      reviews,
      questions,
    });
  } catch (e) {
    return fail(e);
  }
}

// Public review submission from the widget. Tighter rate limit than reads.
export async function POST(req: NextRequest, { params }: { params: { brandId: string } }) {
  try {
    const ip = clientIp(req);
    const { ok: allowed } = rateLimit(`reviews-submit:${ip}`, 10);
    if (!allowed) return fail(new Error('Rate limited'));

    const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
    if (!brand || brand.disabled) return fail(new Error('Unknown brand'));

    const data = reviewSubmitSchema.parse(await req.json());
    const review = await submitReview(brand.id, {
      ...data,
      authorEmail: data.authorEmail || undefined,
      title: data.title || undefined,
      ip,
    });
    return ok({ submitted: true, status: review.status }, 201);
  } catch (e) {
    return fail(e);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
