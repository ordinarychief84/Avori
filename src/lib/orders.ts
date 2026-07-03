import type { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { HttpError } from './auth';
import { track } from './events';
import { emitWebhook } from './webhooks';
import { earnForOrder, getProgram } from './loyalty';
import { addCredit } from './credit';
import { recordReferralConversion } from './referrals';
import { enqueueJob } from './jobs';
import { forwardToDestinations } from './connectors/destinations';

export type IngestOrderInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
  orderNumber?: string;
  externalId?: string;
  status?: OrderStatus;
  currency?: string;
  items: Array<{
    productId?: string;
    sku?: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal?: number;
  discountTotal?: number;
  total?: number;
  discountCodes?: string[];
  placedAt?: Date;
  source?: string;
  // Attribution, lets the storefront credit a referral link or an upsell
  // offer for this order.
  referralCode?: string;
  upsellOfferId?: string;
  ip?: string;
};

// The single pipeline every order flows through, no matter the source
// (dashboard, REST API, Shopify sync). Creates/updates the unified customer,
// writes the order, then fans out to loyalty, referrals, discounts, review
// requests, analytics and webhooks. Side effects after the core transaction
// are best-effort: a loyalty hiccup must not lose an order.
export async function ingestOrder(brandId: string, input: IngestOrderInput) {
  if (input.items.length === 0) throw new HttpError(400, 'Order needs at least one item');

  const email = input.email.trim().toLowerCase();
  const subtotal =
    input.subtotal ?? input.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountTotal = input.discountTotal ?? 0;
  const total = input.total ?? Math.max(subtotal - discountTotal, 0);
  const placedAt = input.placedAt ?? new Date();
  const orderNumber =
    input.orderNumber ??
    `AV-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 36).toString(36).toUpperCase()}`;

  // Resolve items to catalog products by id (validated against this brand)
  // or by SKU, so external carts can send either.
  const skus = input.items.map((i) => i.sku).filter((s): s is string => !!s);
  const ids = input.items.map((i) => i.productId).filter((s): s is string => !!s);
  const catalog = await prisma.product.findMany({
    where: { brandId, OR: [{ id: { in: ids } }, { sku: { in: skus } }] },
    select: { id: true, sku: true },
  });
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const bySku = new Map(catalog.filter((p) => p.sku).map((p) => [p.sku as string, p]));

  const { order, customer } = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { brandId_email: { brandId, email } },
      update: {
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.acceptsMarketing !== undefined
          ? { acceptsMarketing: input.acceptsMarketing }
          : {}),
      },
      create: {
        brandId,
        email,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        phone: input.phone ?? null,
        acceptsMarketing: input.acceptsMarketing ?? false,
        source: input.source ?? 'order',
      },
    });

    const order = await tx.order.create({
      data: {
        brandId,
        customerId: customer.id,
        orderNumber,
        externalId: input.externalId ?? null,
        status: input.status ?? 'PAID',
        currency: input.currency ?? 'USD',
        subtotal,
        discountTotal,
        total,
        discountCodes: input.discountCodes ?? [],
        source: input.source ?? 'manual',
        placedAt,
        items: {
          create: input.items.map((i) => ({
            productId:
              (i.productId && byId.get(i.productId)?.id) ||
              (i.sku && bySku.get(i.sku)?.id) ||
              null,
            name: i.name,
            sku: i.sku ?? null,
            quantity: i.quantity,
            price: i.price,
          })),
        },
      },
      include: { items: true },
    });

    await tx.customer.update({
      where: { id: customer.id },
      data: {
        ordersCount: { increment: 1 },
        totalSpent: { increment: total },
        lastOrderAt: placedAt,
      },
    });

    return { order, customer };
  });

  // ---- Post-commit fan-out (best-effort) ---------------------------------
  const settings = (await brandSettings(brandId)) ?? {};

  try {
    if (order.status === 'PAID' || order.status === 'FULFILLED') {
      await earnForOrder(brandId, customer.id, total, order.id);
      // Rise-style cashback: a percent of every paid order returns as
      // store credit the customer can spend on the next purchase.
      const program = await getProgram(brandId);
      const pct = Number(program?.cashbackPct ?? 0);
      if (program?.enabled && pct > 0 && total > 0) {
        await addCredit({
          brandId,
          customerId: customer.id,
          type: 'CASHBACK',
          amount: Math.round(total * pct) / 100,
          reason: `${pct}% cashback on ${orderNumber}`,
          orderId: order.id,
        });
      }
    }
  } catch (e) {
    console.error('loyalty earn failed', e);
  }

  try {
    if (input.referralCode) {
      await recordReferralConversion({
        brandId,
        code: input.referralCode,
        orderId: order.id,
        orderTotal: total,
        refereeEmail: email,
        ip: input.ip,
      });
    }
  } catch (e) {
    console.error('referral conversion failed', e);
  }

  try {
    if (input.discountCodes?.length) {
      await prisma.discountCampaign.updateMany({
        where: { brandId, code: { in: input.discountCodes } },
        data: { usageCount: { increment: 1 } },
      });
      // Reward-redemption codes get consumed on first use.
      await prisma.rewardRedemption.updateMany({
        where: { brandId, code: { in: input.discountCodes }, usedAt: null },
        data: { usedAt: new Date() },
      });
    }
  } catch (e) {
    console.error('discount usage tracking failed', e);
  }

  try {
    if (input.upsellOfferId) {
      await prisma.upsellOffer.updateMany({
        where: { id: input.upsellOfferId, brandId },
        data: { conversions: { increment: 1 }, revenue: { increment: total } },
      });
      await track({
        brandId,
        type: 'UPSELL_CONVERSION',
        refType: 'upsell',
        refId: input.upsellOfferId,
        meta: { orderId: order.id, total },
      });
    }
  } catch (e) {
    console.error('upsell attribution failed', e);
  }

  try {
    if (settings.reviewRequestsEnabled !== false) {
      const delayDays = Number(settings.reviewRequestDelayDays ?? 7);
      await enqueueJob(
        'review_request',
        { brandId, orderId: order.id, customerId: customer.id },
        { brandId, runAt: new Date(placedAt.getTime() + delayDays * 86_400_000) }
      );
    }
  } catch (e) {
    console.error('review request scheduling failed', e);
  }

  // Marketing destinations (GA4, Klaviyo, Meta, Attentive), fire and forget.
  void forwardToDestinations(brandId, {
    kind: 'order_created',
    email,
    orderId: order.id,
    orderNumber: order.orderNumber,
    total,
    currency: order.currency,
    items: order.items.map((i) => ({
      name: i.name,
      sku: i.sku,
      quantity: i.quantity,
      price: Number(i.price),
    })),
  });

  await track({
    brandId,
    type: 'ORDER_CREATED',
    refType: 'order',
    refId: order.id,
    meta: { total, source: order.source },
  });
  await emitWebhook(brandId, 'order.created', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    email,
    total,
    currency: order.currency,
    items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: Number(i.price) })),
  });

  return order;
}

export async function brandSettings(brandId: string): Promise<Record<string, any> | null> {
  const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { settings: true } });
  return (brand?.settings as Prisma.JsonObject | null) ?? null;
}
