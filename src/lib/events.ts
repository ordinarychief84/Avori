import type { EventType } from '@prisma/client';
import { prisma } from './prisma';

// Unified event stream. Widget events keep videoId/productId; module events
// use refType/refId ("quiz", "upsell", "bundle", "referral", "order", ...).
// Best-effort: analytics must never break the action that produced them.
export async function track(event: {
  brandId: string;
  type: EventType;
  videoId?: string;
  productId?: string;
  refType?: string;
  refId?: string;
  meta?: Record<string, unknown>;
  domain?: string;
  ip?: string;
  ua?: string;
}): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        brandId: event.brandId,
        type: event.type,
        videoId: event.videoId ?? null,
        productId: event.productId ?? null,
        refType: event.refType ?? null,
        refId: event.refId ?? null,
        meta: event.meta ? JSON.parse(JSON.stringify(event.meta)) : undefined,
        domain: event.domain ?? null,
        ip: event.ip ?? null,
        ua: event.ua ?? null,
      },
    });
  } catch (e) {
    console.error('event track failed', e);
  }
}
