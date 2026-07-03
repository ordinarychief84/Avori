import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { shadeAnalyzeSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { analyzeShadeImage, matchProductsForShade } from '@/lib/ai';
import { track } from '@/lib/events';
import { forwardToDestinations } from '@/lib/connectors/destinations';

export const maxDuration = 60;

// AI shade analysis: photo in, cosmetic color profile + product matches out.
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const data = shadeAnalyzeSchema.parse(await req.json());

    const analysis = await analyzeShadeImage(data.imageBase64, data.mediaType);
    const fullAnalysis = { ...analysis, ...(data.intake ? { intake: data.intake } : {}) };
    const productIds = await matchProductsForShade(brandId, analysis);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const email = data.email?.trim().toLowerCase() || null;
    let customerId: string | null = null;
    if (email) {
      const customer = await prisma.customer.upsert({
        where: { brandId_email: { brandId, email } },
        update: {},
        create: { brandId, email, source: 'shade' },
      });
      customerId = customer.id;
    }

    const profile = await prisma.shadeProfile.create({
      data: {
        brandId,
        customerId,
        email,
        skinTone: analysis.skinTone,
        undertone: analysis.undertone,
        lipTone: analysis.lipTone,
        hairColor: analysis.hairColor,
        eyeColor: analysis.eyeColor,
        season: analysis.season,
        analysis: JSON.parse(JSON.stringify(fullAnalysis)),
        recommendedProductIds: productIds,
        source: 'api',
      },
    });
    await track({ brandId, type: 'SHADE_ANALYSIS', refType: 'shade', refId: profile.id });
    void forwardToDestinations(brandId, {
      kind: 'shade_profile',
      email,
      skinTone: analysis.skinTone,
      undertone: analysis.undertone,
      season: analysis.season,
      matches: productIds.length,
    });

    return ok(
      {
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
      },
      201
    );
  } catch (e) {
    return fail(e);
  }
}
