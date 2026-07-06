import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { enqueueJob } from '@/lib/jobs';
import { audit } from '@/lib/audit';
import { fail, ok } from '@/lib/http';

// Custom-app connection: the merchant creates a custom app in their own
// Shopify admin (Settings → Apps → Develop apps), grants read scopes, and
// pastes the Admin API access token here. No platform-level OAuth app or
// SHOPIFY_API_KEY required, which makes Shopify connectable on any deploy.
const bodySchema = z.object({
  shopDomain: z
    .string()
    .min(4)
    .max(120)
    .transform((s) => s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .refine((s) => /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(s), {
      message: 'Enter your your-store.myshopify.com domain',
    }),
  accessToken: z.string().min(20).max(200),
});

const API_VERSION = '2024-10';

export async function POST(req: NextRequest) {
  try {
    const { brandId, userId } = await requireBrand();
    const { shopDomain, accessToken } = bodySchema.parse(await req.json());

    // Prove the token works before saving anything.
    const check = await fetch(`https://${shopDomain}/admin/api/${API_VERSION}/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
      cache: 'no-store',
    }).catch(() => null);
    if (!check || check.status === 401 || check.status === 403) {
      throw new HttpError(
        400,
        'Shopify rejected that token. Check the Admin API access token and that the app is installed.'
      );
    }
    if (!check.ok) {
      throw new HttpError(400, `Could not reach ${shopDomain} (${check.status}). Check the domain.`);
    }

    await prisma.integration.upsert({
      where: { brandId_provider: { brandId, provider: 'SHOPIFY' } },
      create: { brandId, provider: 'SHOPIFY', shopDomain, accessToken, status: 'CONNECTED' },
      update: { shopDomain, accessToken, status: 'CONNECTED' },
    });

    // First sync runs in the background; "Sync now" and the scheduler keep it fresh.
    await enqueueJob('shopify_sync', { brandId }, { brandId });
    await audit({
      brandId,
      userId,
      action: 'integration.shopify.connect_token',
      entity: 'integration',
      meta: { shopDomain },
    });

    return ok({ connected: true, shopDomain });
  } catch (e) {
    return fail(e);
  }
}
