import crypto from 'crypto';
import { prisma } from '../prisma';
import { HttpError } from '../auth';
import type { IntegrationProvider } from '@prisma/client';

// Marketing destinations: Google Analytics 4, Klaviyo, Meta (Conversions
// API) and Attentive. Commerce connectors pull data IN; destinations push
// events OUT. All sends are fire-and-forget from the order/customer
// pipelines — a marketing outage must never break checkout ingestion.

export const MARKETING_PROVIDERS = ['GOOGLE', 'KLAVIYO', 'META', 'ATTENTIVE'] as const;
export type MarketingProvider = (typeof MARKETING_PROVIDERS)[number];

type DestinationConfig = {
  // GOOGLE (GA4 Measurement Protocol)
  measurementId?: string;
  apiSecret?: string;
  // META (Conversions API)
  pixelId?: string;
  // KLAVIYO: accessToken column holds the private key; config.listId optional
  listId?: string;
};

export type DestinationEvent =
  | {
      kind: 'order_created';
      email: string;
      orderId: string;
      orderNumber: string;
      total: number;
      currency: string;
      items: Array<{ name: string; sku?: string | null; quantity: number; price: number }>;
    }
  | { kind: 'customer_created'; email: string; firstName?: string | null; lastName?: string | null }
  | { kind: 'review_submitted'; email?: string | null; productName: string; rating: number };

const TIMEOUT = AbortSignal.timeout.bind(AbortSignal);

function sha256Lower(s: string): string {
  return crypto.createHash('sha256').update(s.trim().toLowerCase()).digest('hex');
}

// ---------------------------------------------------------------------------
// Credential verification (used by the connect endpoint)
// ---------------------------------------------------------------------------

export async function verifyDestination(
  provider: MarketingProvider,
  accessToken: string,
  config: DestinationConfig
): Promise<void> {
  if (provider === 'KLAVIYO') {
    const res = await fetch('https://a.klaviyo.com/api/accounts/', {
      headers: {
        Authorization: `Klaviyo-API-Key ${accessToken}`,
        revision: '2024-10-15',
        accept: 'application/json',
      },
      signal: TIMEOUT(10_000),
    });
    if (!res.ok) throw new HttpError(400, `Klaviyo rejected the API key (${res.status})`);
    return;
  }
  if (provider === 'META') {
    if (!config.pixelId) throw new HttpError(400, 'Meta requires a Pixel ID');
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(config.pixelId)}?fields=id&access_token=${encodeURIComponent(accessToken)}`,
      { signal: TIMEOUT(10_000) }
    );
    if (!res.ok) throw new HttpError(400, `Meta rejected the Pixel ID / access token (${res.status})`);
    return;
  }
  if (provider === 'ATTENTIVE') {
    const res = await fetch('https://api.attentivemobile.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: TIMEOUT(10_000),
    });
    if (!res.ok) throw new HttpError(400, `Attentive rejected the API key (${res.status})`);
    return;
  }
  // GOOGLE: the GA4 Measurement Protocol is write-only — there is no cheap
  // credential probe, so validate shape and accept.
  if (!/^G-[A-Z0-9]{4,}$/i.test(config.measurementId ?? '')) {
    throw new HttpError(400, 'Google requires a GA4 Measurement ID like G-XXXXXXX');
  }
  if (!accessToken) throw new HttpError(400, 'Google requires a Measurement Protocol API secret');
}

// ---------------------------------------------------------------------------
// Per-provider senders
// ---------------------------------------------------------------------------

async function sendGoogle(accessToken: string, config: DestinationConfig, ev: DestinationEvent) {
  const clientId = `avori.${sha256Lower('email' in ev && ev.email ? ev.email : crypto.randomUUID()).slice(0, 16)}`;
  const events =
    ev.kind === 'order_created'
      ? [
          {
            name: 'purchase',
            params: {
              transaction_id: ev.orderNumber,
              value: ev.total,
              currency: ev.currency,
              items: ev.items.map((i) => ({
                item_name: i.name,
                item_id: i.sku ?? undefined,
                price: i.price,
                quantity: i.quantity,
              })),
            },
          },
        ]
      : ev.kind === 'customer_created'
        ? [{ name: 'sign_up', params: { method: 'avori' } }]
        : [{ name: 'review_submitted', params: { rating: ev.rating, item_name: ev.productName } }];

  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(config.measurementId!)}&api_secret=${encodeURIComponent(accessToken)}`,
    {
      method: 'POST',
      body: JSON.stringify({ client_id: clientId, events }),
      signal: TIMEOUT(8_000),
    }
  );
}

async function sendKlaviyo(accessToken: string, _config: DestinationConfig, ev: DestinationEvent) {
  const email = 'email' in ev ? ev.email : null;
  if (!email) return;
  const metricName =
    ev.kind === 'order_created'
      ? 'Placed Order (Avori)'
      : ev.kind === 'customer_created'
        ? 'Created Account (Avori)'
        : 'Submitted Review (Avori)';
  const properties =
    ev.kind === 'order_created'
      ? { OrderId: ev.orderNumber, Items: ev.items.map((i) => i.name) }
      : ev.kind === 'review_submitted'
        ? { Product: ev.productName, Rating: ev.rating }
        : {};

  await fetch('https://a.klaviyo.com/api/events/', {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${accessToken}`,
      revision: '2024-10-15',
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          properties,
          ...(ev.kind === 'order_created' ? { value: ev.total } : {}),
          metric: { data: { type: 'metric', attributes: { name: metricName } } },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email,
                ...('firstName' in ev && ev.firstName ? { first_name: ev.firstName } : {}),
                ...('lastName' in ev && ev.lastName ? { last_name: ev.lastName } : {}),
              },
            },
          },
        },
      },
    }),
    signal: TIMEOUT(8_000),
  });
}

async function sendMeta(accessToken: string, config: DestinationConfig, ev: DestinationEvent) {
  const email = 'email' in ev && ev.email ? ev.email : null;
  if (!email || !config.pixelId) return;
  const eventName =
    ev.kind === 'order_created' ? 'Purchase' : ev.kind === 'customer_created' ? 'CompleteRegistration' : 'SubmitApplication';
  const data = [
    {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      user_data: { em: [sha256Lower(email)] },
      ...(ev.kind === 'order_created'
        ? { custom_data: { currency: ev.currency, value: ev.total, order_id: ev.orderNumber } }
        : {}),
    },
  ];
  await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(config.pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data }),
      signal: TIMEOUT(8_000),
    }
  );
}

async function sendAttentive(accessToken: string, _config: DestinationConfig, ev: DestinationEvent) {
  const email = 'email' in ev && ev.email ? ev.email : null;
  if (!email) return;
  const type =
    ev.kind === 'order_created' ? 'avori_order' : ev.kind === 'customer_created' ? 'avori_signup' : 'avori_review';
  await fetch('https://api.attentivemobile.com/v1/events/custom', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      type,
      user: { email },
      properties:
        ev.kind === 'order_created'
          ? { orderNumber: ev.orderNumber, total: ev.total, currency: ev.currency }
          : ev.kind === 'review_submitted'
            ? { product: ev.productName, rating: ev.rating }
            : {},
    }),
    signal: TIMEOUT(8_000),
  });
}

const SENDERS: Record<
  MarketingProvider,
  (token: string, config: DestinationConfig, ev: DestinationEvent) => Promise<void>
> = {
  GOOGLE: sendGoogle,
  KLAVIYO: sendKlaviyo,
  META: sendMeta,
  ATTENTIVE: sendAttentive,
};

// ---------------------------------------------------------------------------
// Fan-out
// ---------------------------------------------------------------------------

// Best-effort broadcast to every connected destination. Callers do not await
// individual sends beyond this function; failures are logged, never thrown.
export async function forwardToDestinations(brandId: string, ev: DestinationEvent): Promise<void> {
  try {
    const destinations = await prisma.integration.findMany({
      where: {
        brandId,
        status: 'CONNECTED',
        provider: { in: MARKETING_PROVIDERS as unknown as IntegrationProvider[] },
      },
    });
    await Promise.allSettled(
      destinations.map(async (d) => {
        try {
          await SENDERS[d.provider as MarketingProvider](
            d.accessToken ?? '',
            (d.config as DestinationConfig | null) ?? {},
            ev
          );
        } catch (e) {
          console.error(`destination ${d.provider} send failed`, e);
        }
      })
    );
  } catch (e) {
    console.error('destination fan-out failed', e);
  }
}
