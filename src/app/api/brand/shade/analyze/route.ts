import { NextRequest } from 'next/server';
import { requireBrand } from '@/lib/auth';
import { shadeAnalyzeSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { performShadeAnalysis } from '@/lib/shade';

export const maxDuration = 60;

// Dashboard tester for the shade analyzer, same pipeline as the public and
// REST endpoints so merchants verify exactly what shoppers will get.
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = shadeAnalyzeSchema.parse(await req.json());
    const result = await performShadeAnalysis(brandId, {
      imageBase64: data.imageBase64,
      mediaType: data.mediaType,
      email: data.email || null,
      intake: data.intake,
      source: 'dashboard',
    });
    return ok(result);
  } catch (e) {
    return fail(e);
  }
}
