import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { reviewModerateSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { recomputeProductRating, grantReviewBonus } from '@/lib/reviews';
import { syncReviewUgc } from '@/lib/ugc';
import { emitWebhook } from '@/lib/webhooks';
import { audit } from '@/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId, userId } = await requireBrand();
    const data = reviewModerateSchema.parse(await req.json());
    const existing = await prisma.review.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Review not found');

    const review = await prisma.review.update({
      where: { id: existing.id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.reply !== undefined
          ? { reply: data.reply || null, repliedAt: data.reply ? new Date() : null }
          : {}),
      },
    });

    if (data.status !== undefined && data.status !== existing.status) {
      await recomputeProductRating(existing.productId);
      await syncReviewUgc(brandId, review.id, {
        revive: data.status === 'APPROVED' && existing.status !== 'APPROVED',
      });
      if (data.status === 'APPROVED') {
        await grantReviewBonus(brandId, review.id);
        await emitWebhook(brandId, 'review.approved', {
          reviewId: review.id,
          productId: review.productId,
          rating: review.rating,
        });
      }
      await audit({
        brandId,
        userId,
        action: `review.${data.status.toLowerCase()}`,
        entity: 'review',
        entityId: review.id,
      });
    }
    return ok({ review });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.review.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Review not found');
    await prisma.review.delete({ where: { id: existing.id } });
    // The gallery keeps only a soft pointer to the review, clean up manually.
    await prisma.ugcItem.deleteMany({ where: { brandId, reviewId: existing.id } });
    await recomputeProductRating(existing.productId);
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
