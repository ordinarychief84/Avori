import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { normalizeStoreUrl, testWooConnection } from '@/lib/connectors/woocommerce';
import { enqueueJob } from '@/lib/jobs';
import { audit } from '@/lib/audit';

const schema = z.object({
  storeUrl: z.string().min(4).max(300),
  consumerKey: z.string().min(10).max(200),
  consumerSecret: z.string().min(10).max(200),
  webhookSecret: z.string().max(200).optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  try {
    const { brandId, userId } = await requireBrand();
    const data = schema.parse(await req.json());
    const origin = normalizeStoreUrl(data.storeUrl);
    const accessToken = `${data.consumerKey.trim()}:${data.consumerSecret.trim()}`;

    // Validate the keys before saving anything.
    await testWooConnection(origin, accessToken);

    await prisma.integration.upsert({
      where: { brandId_provider: { brandId, provider: 'WOOCOMMERCE' } },
      update: {
        shopDomain: origin,
        accessToken,
        status: 'CONNECTED',
        syncState: { webhookSecret: data.webhookSecret || null },
      },
      create: {
        brandId,
        provider: 'WOOCOMMERCE',
        shopDomain: origin,
        accessToken,
        status: 'CONNECTED',
        syncState: { webhookSecret: data.webhookSecret || null },
      },
    });

    await enqueueJob('woo_sync', { brandId }, { brandId });
    await audit({ brandId, userId, action: 'integration.connect', entity: 'integration', meta: { provider: 'WOOCOMMERCE', origin } });
    return ok({ connected: true, origin });
  } catch (e) {
    return fail(e);
  }
}
