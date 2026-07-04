import { NextRequest } from 'next/server';
import { requireApiKey } from '@/lib/apikey';
import { shadeAnalyzeSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { performShadeAnalysis } from '@/lib/shade';

export const maxDuration = 60;

// AI shade analysis: photo in, cosmetic color profile + product matches out.
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const data = shadeAnalyzeSchema.parse(await req.json());
    const result = await performShadeAnalysis(brandId, {
      imageBase64: data.imageBase64,
      mediaType: data.mediaType,
      email: data.email || null,
      intake: data.intake,
      source: 'api',
    });
    return ok(result, 201);
  } catch (e) {
    return fail(e);
  }
}
