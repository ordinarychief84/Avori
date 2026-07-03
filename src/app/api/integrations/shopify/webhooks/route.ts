import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok } from '@/lib/http';
import { verifyWebhookHmac } from '@/lib/connectors/shopify';
import { ingestOrder } from '@/lib/orders';

// Receiver for Shopify webhooks (orders/create, customers/create...).
// Shopify expects a 200 quickly; processing failures are logged, not retried
// here (Shopify retries deliveries itself).
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const hmac = req.headers.get('x-shopify-hmac-sha256') ?? '';
  const topic = req.headers.get('x-shopify-topic') ?? '';
  const shop = req.headers.get('x-shopify-shop-domain') ?? '';

  if (!verifyWebhookHmac(raw, hmac)) {
    return new Response('invalid hmac', { status: 401 });
  }

  const integration = await prisma.integration.findFirst({
    where: { provider: 'SHOPIFY', shopDomain: shop },
  });
  if (!integration) return ok({ ignored: true });

  try {
    const payload = JSON.parse(raw);
    if (topic === 'orders/create' && payload.email) {
      await ingestOrder(integration.brandId, {
        email: payload.email,
        orderNumber: payload.name,
        externalId: String(payload.id),
        status: 'PAID',
        currency: payload.currency,
        items: (payload.line_items ?? []).map(
          (li: { title: string; sku?: string; quantity: number; price: string }) => ({
            name: li.title,
            sku: li.sku ?? undefined,
            quantity: li.quantity,
            price: Number(li.price),
          })
        ),
        subtotal: Number(payload.subtotal_price ?? 0),
        discountTotal: Number(payload.total_discounts ?? 0),
        total: Number(payload.total_price ?? 0),
        discountCodes: (payload.discount_codes ?? []).map((d: { code: string }) => d.code),
        placedAt: payload.created_at ? new Date(payload.created_at) : undefined,
        source: 'shopify',
      });
    }
  } catch (e) {
    console.error(`shopify webhook ${topic} failed`, e);
  }
  return ok({ received: true });
}
