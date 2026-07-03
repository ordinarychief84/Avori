import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { buildInstallUrl, signOAuthState } from '@/lib/connectors/shopify';

const schema = z.object({ shopDomain: z.string().min(4).max(200) });

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const { shopDomain } = schema.parse(await req.json());
    const domain = shopDomain.trim().toLowerCase();

    await prisma.integration.upsert({
      where: { brandId_provider: { brandId, provider: 'SHOPIFY' } },
      update: { shopDomain: domain, status: 'PENDING' },
      create: { brandId, provider: 'SHOPIFY', shopDomain: domain, status: 'PENDING' },
    });

    const url = buildInstallUrl(domain, signOAuthState(brandId));
    return ok({ url });
  } catch (e) {
    return fail(e);
  }
}
