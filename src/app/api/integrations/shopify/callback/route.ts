import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCallbackHmac, exchangeToken, verifyOAuthState } from '@/lib/connectors/shopify';
import { enqueueJob } from '@/lib/jobs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const redirect = (msg: string) =>
    NextResponse.redirect(new URL(`/dashboard/settings?shopify=${msg}`, url.origin));

  try {
    const params = url.searchParams;
    const shop = params.get('shop');
    const code = params.get('code');
    const state = params.get('state') ?? '';

    const brandId = verifyOAuthState(state);
    if (!brandId || !shop || !code) return redirect('error');
    if (!verifyCallbackHmac(params)) return redirect('error');

    const accessToken = await exchangeToken(shop, code);
    await prisma.integration.upsert({
      where: { brandId_provider: { brandId, provider: 'SHOPIFY' } },
      update: { shopDomain: shop, accessToken, status: 'CONNECTED' },
      create: { brandId, provider: 'SHOPIFY', shopDomain: shop, accessToken, status: 'CONNECTED' },
    });
    // First sync runs in the background via the job queue.
    await enqueueJob('shopify_sync', { brandId }, { brandId });
    return redirect('connected');
  } catch (e) {
    console.error('shopify callback failed', e);
    return redirect('error');
  }
}
