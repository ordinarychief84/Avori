import { prisma } from './prisma';
import { HttpError } from './auth';
import { track } from './events';
import { emitWebhook } from './webhooks';
import { syncReviewUgc } from './ugc';
import { getProgram, ensureMember, addPoints } from './loyalty';
import { brandSettings } from './orders';
import { forwardToDestinations } from './connectors/destinations';

// Keep the denormalized rating stats on Product in sync with approved reviews.
export async function recomputeProductRating(productId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { productId, status: 'APPROVED' },
    _count: true,
    _avg: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      reviewsCount: agg._count,
      ratingAvg: agg._avg.rating !== null ? Math.round(agg._avg.rating * 100) / 100 : null,
    },
  });
}

// Shared submit pipeline for the public widget endpoint and the REST API.
// Handles verified-purchase detection, auto-publish threshold, analytics,
// webhooks and the loyalty review bonus.
export async function submitReview(
  brandId: string,
  input: {
    productId: string;
    rating: number;
    title?: string;
    body: string;
    authorName: string;
    authorEmail?: string;
    mediaUrls?: string[];
    orderId?: string;
    ip?: string;
  }
) {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, brandId },
    select: { id: true },
  });
  if (!product) throw new HttpError(404, 'Product not found');

  const email = input.authorEmail?.trim().toLowerCase() || null;
  const customer = email
    ? await prisma.customer.findUnique({ where: { brandId_email: { brandId, email } } })
    : null;

  // Verified purchase: the reviewer's customer record has an order containing
  // this product (or the explicitly referenced order does).
  let verified = false;
  if (customer) {
    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId: input.productId,
        order: {
          brandId,
          customerId: customer.id,
          ...(input.orderId ? { id: input.orderId } : {}),
          status: { notIn: ['CANCELLED'] },
        },
      },
      select: { id: true },
    });
    verified = !!purchase;
  }

  // Auto-publish: ratings at/above the configured threshold skip moderation.
  // Default 6 (= never auto-publish) keeps merchants in control until they
  // opt in from review settings.
  const settings = (await brandSettings(brandId)) ?? {};
  const threshold = Number(settings.reviewAutoPublishMinRating ?? 6);
  const status = input.rating >= threshold ? 'APPROVED' : 'PENDING';

  const review = await prisma.review.create({
    data: {
      brandId,
      productId: input.productId,
      customerId: customer?.id ?? null,
      orderId: input.orderId ?? null,
      authorName: input.authorName,
      authorEmail: email,
      rating: input.rating,
      title: input.title || null,
      body: input.body,
      mediaUrls: input.mediaUrls ?? [],
      verified,
      status,
    },
  });

  if (status === 'APPROVED') {
    await recomputeProductRating(input.productId);
    await grantReviewBonus(brandId, review.id);
    await syncReviewUgc(brandId, review.id);
  }

  await track({
    brandId,
    type: 'REVIEW_SUBMIT',
    productId: input.productId,
    refType: 'review',
    refId: review.id,
    meta: { rating: input.rating, verified },
    ip: input.ip,
  });
  await emitWebhook(brandId, 'review.created', {
    reviewId: review.id,
    productId: input.productId,
    rating: input.rating,
    status,
    verified,
  });

  const productName = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { name: true },
  });
  void forwardToDestinations(brandId, {
    kind: 'review_submitted',
    email,
    productName: productName?.name ?? 'Product',
    rating: input.rating,
  });

  return review;
}

// Loyalty bonus for an approved review, granted at most once per review
// (guarded by a reason marker on the points ledger).
export async function grantReviewBonus(brandId: string, reviewId: string): Promise<void> {
  const program = await getProgram(brandId);
  if (!program?.enabled || program.reviewBonus <= 0) return;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review?.customerId) return;

  const marker = `review:${reviewId}`;
  const already = await prisma.pointsTransaction.findFirst({
    where: { brandId, reason: marker },
    select: { id: true },
  });
  if (already) return;

  const member = await ensureMember(brandId, review.customerId);
  await addPoints({
    brandId,
    memberId: member.id,
    type: 'REVIEW',
    points: program.reviewBonus,
    reason: marker,
  });
}
