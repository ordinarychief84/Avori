import crypto from 'crypto';
import { prisma } from './prisma';

// Outbound webhooks. emitWebhook fans a topic out to every subscribed
// endpoint as a WebhookDelivery row, then attempts delivery immediately.
// Failed deliveries are retried by the job runner with quadratic backoff.

const MAX_ATTEMPTS = 5;
const TIMEOUT_MS = 5_000;

export async function emitWebhook(
  brandId: string,
  topic: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { brandId, active: true },
    });
    const subscribed = endpoints.filter(
      (ep) => ep.topics.length === 0 || ep.topics.includes(topic)
    );
    for (const ep of subscribed) {
      const delivery = await prisma.webhookDelivery.create({
        data: { endpointId: ep.id, topic, payload: JSON.parse(JSON.stringify(payload)) },
      });
      // First attempt inline but fire-and-forget, callers never wait on
      // third-party servers.
      void attemptDelivery(delivery.id).catch(() => {});
    }
  } catch (e) {
    console.error('emitWebhook failed', e);
  }
}

export function signWebhook(secret: string, body: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export async function attemptDelivery(deliveryId: string): Promise<void> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { endpoint: true },
  });
  if (!delivery || delivery.deliveredAt) return;

  const body = JSON.stringify({
    id: delivery.id,
    topic: delivery.topic,
    createdAt: delivery.createdAt.toISOString(),
    data: delivery.payload,
  });

  let responseCode: number | null = null;
  try {
    const res = await fetch(delivery.endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Avori-Topic': delivery.topic,
        'X-Avori-Signature': signWebhook(delivery.endpoint.secret, body),
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    responseCode = res.status;
  } catch {
    responseCode = null; // network error / timeout
  }

  const attempts = delivery.attempts + 1;
  const succeeded = responseCode !== null && responseCode >= 200 && responseCode < 300;
  await prisma.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      attempts,
      responseCode,
      deliveredAt: succeeded ? new Date() : null,
      // Quadratic backoff: 1, 4, 9, 16 minutes. After MAX_ATTEMPTS we stop.
      nextAttemptAt:
        succeeded || attempts >= MAX_ATTEMPTS
          ? null
          : new Date(Date.now() + attempts * attempts * 60_000),
    },
  });
}

// Called by the job runner: retry everything due.
export async function retryDueWebhooks(limit = 25): Promise<number> {
  const due = await prisma.webhookDelivery.findMany({
    where: { deliveredAt: null, nextAttemptAt: { not: null, lte: new Date() } },
    take: limit,
    select: { id: true },
  });
  for (const d of due) await attemptDelivery(d.id);
  return due.length;
}
