import { NextRequest } from 'next/server';
import { requireBrand } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { generateReviewSummary } from '@/lib/ai';

// Regenerates the cached AI review summary shown in the reviews widget.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const summary = await generateReviewSummary(brandId, params.id);
    return ok({ summary });
  } catch (e) {
    return fail(e);
  }
}
