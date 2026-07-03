import crypto from 'crypto';
import { prisma } from '../prisma';
import { HttpError } from '../auth';
import { ingestOrder } from '../orders';
import type { OrderStatus } from '@prisma/client';

// WooCommerce connector. Unlike Shopify (app OAuth), Woo uses per-store REST
// keys the merchant creates under WooCommerce → Settings → Advanced → REST
// API. Credentials live on the Integration row: shopDomain = store origin,
// accessToken = "consumerKey:consumerSecret", syncState.webhookSecret =
// shared secret for inbound webhook signatures.

export function normalizeStoreUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//.test(url)) url = `https://${url}`;
  const u = new URL(url);
  if (u.protocol !== 'https:') throw new HttpError(400, 'Store URL must use https://');
  return `${u.protocol}//${u.host}`;
}

function authHeader(accessToken: string): string {
  return `Basic ${Buffer.from(accessToken).toString('base64')}`;
}

async function wooGet<T>(origin: string, accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${origin}/wp-json/wc/v3/${path}`, {
    headers: { Authorization: authHeader(accessToken) },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new HttpError(400, `WooCommerce GET ${path} failed (${res.status})`);
  return (await res.json()) as T;
}

// Cheap credential check used by the connect endpoint.
export async function testWooConnection(origin: string, accessToken: string): Promise<void> {
  await wooGet(origin, accessToken, 'products?per_page=1');
}

// Woo signs webhook bodies with HMAC-SHA256 (base64) using the secret set on
// the webhook definition in the Woo admin.
export function verifyWooWebhook(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function mapWooStatus(status: string): OrderStatus {
  switch (status) {
    case 'completed':
      return 'FULFILLED';
    case 'processing':
      return 'PAID';
    case 'refunded':
      return 'REFUNDED';
    case 'cancelled':
    case 'failed':
    case 'trash':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

type WooProduct = {
  id: number;
  name: string;
  permalink: string;
  price: string;
  sku: string;
  status: string;
  images: Array<{ src: string }>;
};

type WooCustomer = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  billing?: { phone?: string };
};

export type WooOrder = {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  discount_total: string;
  date_created: string;
  billing?: { email?: string; first_name?: string; last_name?: string; phone?: string };
  coupon_lines?: Array<{ code: string }>;
  line_items: Array<{ name: string; sku?: string; quantity: number; price: number | string; subtotal: string }>;
};

export async function ingestWooOrder(brandId: string, o: WooOrder): Promise<boolean> {
  const email = o.billing?.email;
  if (!email) return false;
  const exists = await prisma.order.findFirst({
    where: { brandId, externalId: `woo-${o.id}` },
    select: { id: true },
  });
  if (exists) return false;

  const subtotal = o.line_items.reduce((sum, li) => sum + Number(li.subtotal ?? 0), 0);
  await ingestOrder(brandId, {
    email,
    firstName: o.billing?.first_name,
    lastName: o.billing?.last_name,
    phone: o.billing?.phone,
    orderNumber: `#${o.number}`,
    externalId: `woo-${o.id}`,
    status: mapWooStatus(o.status),
    currency: o.currency,
    items: o.line_items.map((li) => ({
      name: li.name,
      sku: li.sku || undefined,
      quantity: li.quantity,
      price: Number(li.price),
    })),
    subtotal,
    discountTotal: Number(o.discount_total ?? 0),
    total: Number(o.total),
    discountCodes: (o.coupon_lines ?? []).map((c) => c.code.toUpperCase()),
    placedAt: o.date_created ? new Date(o.date_created) : undefined,
    source: 'woocommerce',
  });
  return true;
}

export async function runWooSync(
  brandId: string
): Promise<{ products: number; customers: number; orders: number }> {
  const integration = await prisma.integration.findUnique({
    where: { brandId_provider: { brandId, provider: 'WOOCOMMERCE' } },
  });
  if (!integration?.accessToken || !integration.shopDomain) {
    throw new HttpError(400, 'WooCommerce is not connected for this workspace');
  }
  const { shopDomain: origin, accessToken } = integration as {
    shopDomain: string;
    accessToken: string;
  };

  const products = await wooGet<WooProduct[]>(origin, accessToken, 'products?per_page=100');
  for (const p of products) {
    const sku = `woo-${p.id}`;
    const data = {
      name: p.name,
      price: Number(p.price || 0),
      imageUrl: p.images[0]?.src ?? 'https://placehold.co/400x400?text=No+image',
      productUrl: p.permalink,
      status: (p.status === 'publish' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
    };
    const existing = await prisma.product.findFirst({ where: { brandId, sku } });
    if (existing) await prisma.product.update({ where: { id: existing.id }, data });
    else await prisma.product.create({ data: { ...data, brandId, sku } });
  }

  const customers = await wooGet<WooCustomer[]>(origin, accessToken, 'customers?per_page=100');
  for (const c of customers) {
    if (!c.email) continue;
    await prisma.customer.upsert({
      where: { brandId_email: { brandId, email: c.email.toLowerCase() } },
      update: {
        firstName: c.first_name || null,
        lastName: c.last_name || null,
        phone: c.billing?.phone || null,
        externalId: `woo-${c.id}`,
      },
      create: {
        brandId,
        email: c.email.toLowerCase(),
        firstName: c.first_name || null,
        lastName: c.last_name || null,
        phone: c.billing?.phone || null,
        source: 'woocommerce',
        externalId: `woo-${c.id}`,
      },
    });
  }

  const orders = await wooGet<WooOrder[]>(origin, accessToken, 'orders?per_page=100');
  let orderCount = 0;
  for (const o of orders) {
    if (await ingestWooOrder(brandId, o)) orderCount++;
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { status: 'CONNECTED', lastSyncAt: new Date() },
  });

  return { products: products.length, customers: customers.length, orders: orderCount };
}
