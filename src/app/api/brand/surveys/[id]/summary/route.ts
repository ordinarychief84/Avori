import { NextRequest } from 'next/server';
import { requireBrand } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { generateSurveySummary } from '@/lib/ai';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const summary = await generateSurveySummary(brandId, params.id);
    return ok({ summary });
  } catch (e) {
    return fail(e);
  }
}
