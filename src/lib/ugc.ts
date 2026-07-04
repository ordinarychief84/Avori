import { prisma } from '@/lib/prisma';

// Mirrors review media into the standalone UGC gallery. Called whenever a
// review's status changes so the gallery stays in sync with moderation:
// approved reviews contribute their photos/videos as PENDING gallery items
// (merchants curate what actually ships to the storefront), un-approving a
// review hides its items again. `revive` re-surfaces auto-hidden items and is
// only set on an explicit rejected → approved transition, so items a merchant
// hid by hand stay hidden during bulk imports.
export async function syncReviewUgc(
  brandId: string,
  reviewId: string,
  opts: { revive?: boolean } = {}
): Promise<number> {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, brandId },
    select: { id: true, status: true, mediaUrls: true, productId: true, authorName: true },
  });
  if (!review) return 0;

  if (review.status !== 'APPROVED') {
    await prisma.ugcItem.updateMany({
      where: { brandId, reviewId, status: { not: 'HIDDEN' } },
      data: { status: 'HIDDEN' },
    });
    return 0;
  }

  if (review.mediaUrls.length === 0) return 0;

  const existing = await prisma.ugcItem.findMany({
    where: { brandId, reviewId },
    select: { mediaUrl: true },
  });
  const have = new Set(existing.map((i) => i.mediaUrl));
  const missing = review.mediaUrls.filter((url) => !have.has(url));

  if (missing.length > 0) {
    await prisma.ugcItem.createMany({
      data: missing.map((mediaUrl) => ({
        brandId,
        source: 'REVIEW' as const,
        status: 'PENDING' as const,
        mediaUrl,
        mediaType: /\.(mp4|webm|mov)(\?|$)/i.test(mediaUrl) ? 'VIDEO' : 'IMAGE',
        creditName: review.authorName,
        productIds: [review.productId],
        reviewId: review.id,
      })),
    });
  }

  if (opts.revive) {
    await prisma.ugcItem.updateMany({
      where: { brandId, reviewId, status: 'HIDDEN' },
      data: { status: 'PENDING' },
    });
  }

  return missing.length;
}

// Backfill: sweep every approved review that has media and create any gallery
// items that don't exist yet. Idempotent, safe to run repeatedly.
export async function importReviewUgc(brandId: string): Promise<number> {
  const reviews = await prisma.review.findMany({
    where: { brandId, status: 'APPROVED', mediaUrls: { isEmpty: false } },
    select: { id: true },
  });
  let created = 0;
  for (const review of reviews) {
    created += await syncReviewUgc(brandId, review.id);
  }
  return created;
}
