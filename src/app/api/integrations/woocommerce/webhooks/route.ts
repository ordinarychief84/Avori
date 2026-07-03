import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok } from '@/lib/http';
import {
  verifyWooWebhook,
  ingestWooOrder,
  normalizeStoreUrl,
  type WooOrder,
} from '@/lib/connectors/woocommerce';

// Receiver for WooCommerce webhooks (topic "Order created" → this URL).
// Woo identifies the sender via X-WC-Webhook-Source and signs the body with
// the per-webhook secret (X-WC-Webhook-Signature, HMAC-SHA256 base64).
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const source = req.headers.get('x-wc-webhook-source') ?? '';
  const signature = req.headers.get('x-wc-webhook-signature') ?? '';
  const topic = req.headers.get('x-wc-webhook-topic') ?? '';

  // Woo sends an unsigned ping when the webhook is first saved.
  if (!topic && raw.includes('webhook_id')) return ok({ pong: true });

  let origin: string;
  try {
    origin = normalizeStoreUrl(source);
  } catch {
    return new Response('unknown source', { status: 400 });
  }

  const integration = await prisma.integration.findFirst({
    where: { provider: 'WOOCOMMERCE', shopDomain: origin },
  });
  if (!integration) return ok({ ignored: true });

  const secret =
    ((integration.syncState as { webhookSecret?: string | null } | null)?.webhookSecret ?? '') || '';
  if (!verifyWooWebhook(raw, signature, secret)) {
    return new Response('invalid signature', { status: 401 });
  }

  try {
    if (topic.startsWith('order.')) {
      const payload = JSON.parse(raw) as WooOrder;
      await ingestWooOrder(integration.brandId, payload);
    }
  } catch (e) {
    console.error(`woocommerce webhook ${topic} failed`, e);
  }
  return ok({ received: true });
}
