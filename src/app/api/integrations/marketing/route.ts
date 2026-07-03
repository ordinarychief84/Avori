import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { verifyDestination, MARKETING_PROVIDERS, type MarketingProvider } from '@/lib/connectors/destinations';
import { audit } from '@/lib/audit';

const connectSchema = z.object({
  provider: z.enum(MARKETING_PROVIDERS),
  // Klaviyo private key / Meta CAPI token / GA4 API secret / Attentive key
  accessToken: z.string().min(4).max(500),
  pixelId: z.string().max(100).optional().or(z.literal('')),
  measurementId: z.string().max(60).optional().or(z.literal('')),
  listId: z.string().max(100).optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  try {
    const { brandId, userId } = await requireBrand();
    const data = connectSchema.parse(await req.json());
    const config = {
      ...(data.pixelId ? { pixelId: data.pixelId } : {}),
      ...(data.measurementId ? { measurementId: data.measurementId.toUpperCase() } : {}),
      ...(data.listId ? { listId: data.listId } : {}),
    };

    await verifyDestination(data.provider, data.accessToken.trim(), config);

    const integration = await prisma.integration.upsert({
      where: { brandId_provider: { brandId, provider: data.provider } },
      update: { accessToken: data.accessToken.trim(), config, status: 'CONNECTED' },
      create: {
        brandId,
        provider: data.provider,
        accessToken: data.accessToken.trim(),
        config,
        status: 'CONNECTED',
      },
    });
    await audit({
      brandId,
      userId,
      action: 'integration.connect',
      entity: 'integration',
      entityId: integration.id,
      meta: { provider: data.provider },
    });
    return ok({ connected: true, provider: data.provider });
  } catch (e) {
    return fail(e);
  }
}

const disconnectSchema = z.object({ provider: z.enum(MARKETING_PROVIDERS) });

export async function DELETE(req: NextRequest) {
  try {
    const { brandId, userId } = await requireBrand();
    const { provider } = disconnectSchema.parse(await req.json());
    const existing = await prisma.integration.findUnique({
      where: { brandId_provider: { brandId, provider: provider as MarketingProvider } },
    });
    if (!existing) throw new HttpError(404, 'Not connected');
    await prisma.integration.delete({ where: { id: existing.id } });
    await audit({ brandId, userId, action: 'integration.disconnect', entity: 'integration', meta: { provider } });
    return ok({ disconnected: true });
  } catch (e) {
    return fail(e);
  }
}
