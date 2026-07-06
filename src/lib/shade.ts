import { prisma } from './prisma';
import { HttpError } from './auth';
import { analyzeShadeImage, matchProductsForShade } from './ai';
import { track } from './events';
import { forwardToDestinations } from './connectors/destinations';

// One shade-analysis pipeline shared by the dashboard tester, the REST API
// and the hosted/public analyzer: run vision, match the catalog, store the
// profile, then notify analytics and marketing destinations.

export type ShadeIntake = {
  skinType?: string;
  finish?: string;
  coverage?: string;
};

export type ShadeRecommendation = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  tryOnEnabled: boolean;
  tryOnTint: string | null;
};

export async function performShadeAnalysis(
  brandId: string,
  input: {
    imageBase64: string;
    mediaType: string;
    email?: string | null;
    intake?: ShadeIntake;
    source: string;
  }
) {
  const email = input.email?.trim().toLowerCase() || null;
  const analysis = await analyzeShadeImage(input.imageBase64, input.mediaType);
  const fullAnalysis = { ...analysis, ...(input.intake ? { intake: input.intake } : {}) };
  const productIds = await matchProductsForShade(brandId, analysis);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const byId = new Map(products.map((p) => [p.id, p]));

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
      source: input.source,
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

  const recommendations: ShadeRecommendation[] = productIds
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
    }));

  return { profileId: profile.id, analysis, recommendations };
}

// Post-result lead capture: "not ready to buy" shoppers leave an email and
// their profile attaches to a customer record for follow-up campaigns.
export async function claimShadeProfile(brandId: string, profileId: string, email: string) {
  const profile = await prisma.shadeProfile.findFirst({ where: { id: profileId, brandId } });
  if (!profile) throw new HttpError(404, 'Analysis not found');

  const normalized = email.trim().toLowerCase();
  // One claim per profile (see claimQuizResponse).
  if (profile.email && profile.email !== normalized) {
    throw new HttpError(409, 'This analysis is already saved to another email');
  }
  const existing = await prisma.customer.findUnique({
    where: { brandId_email: { brandId, email: normalized } },
    select: { id: true },
  });
  const customer = await prisma.customer.upsert({
    where: { brandId_email: { brandId, email: normalized } },
    update: {},
    create: { brandId, email: normalized, source: 'shade' },
  });
  await prisma.shadeProfile.update({
    where: { id: profile.id },
    data: { email: normalized, customerId: customer.id },
  });

  if (!existing) {
    void forwardToDestinations(brandId, { kind: 'customer_created', email: normalized });
  }
  void forwardToDestinations(brandId, {
    kind: 'shade_profile',
    email: normalized,
    skinTone: profile.skinTone ?? 'unknown',
    undertone: profile.undertone ?? 'unknown',
    season: profile.season ?? 'unknown',
    matches: profile.recommendedProductIds.length,
  });
  return { saved: true };
}
