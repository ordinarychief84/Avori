import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { shadeAnalyzeSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { analyzeShadeImage, matchProductsForShade } from '@/lib/ai';
import { track } from '@/lib/events';

export const maxDuration = 60;

// Dashboard tester for the shade analyzer — same pipeline as the public
// /api/v1/shade/analyze endpoint, but session-authenticated so merchants
// can verify the computer vision before wiring up their storefront.
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = shadeAnalyzeSchema.parse(await req.json());

    const analysis = await analyzeShadeImage(data.imageBase64, data.mediaType);
    const productIds = await matchProductsForShade(brandId, analysis);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const byId = new Map(products.map((p) => [p.id, p]));

    const profile = await prisma.shadeProfile.create({
      data: {
        brandId,
        email: data.email?.toLowerCase() || null,
        skinTone: analysis.skinTone,
        undertone: analysis.undertone,
        lipTone: analysis.lipTone,
        hairColor: analysis.hairColor,
        eyeColor: analysis.eyeColor,
        season: analysis.season,
        analysis: JSON.parse(JSON.stringify(analysis)),
        recommendedProductIds: productIds,
        source: 'dashboard',
      },
    });
    await track({ brandId, type: 'SHADE_ANALYSIS', refType: 'shade', refId: profile.id });

    return ok({
      profileId: profile.id,
      analysis,
      recommendations: productIds
        .map((id) => byId.get(id))
        .filter((p) => p !== undefined)
        .map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          imageUrl: p.imageUrl,
          productUrl: p.productUrl,
          tryOnEnabled: p.tryOnEnabled,
          tryOnTint: p.tryOnTint,
        })),
    });
  } catch (e) {
    return fail(e);
  }
}
