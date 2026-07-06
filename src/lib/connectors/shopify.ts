import 'server-only'; // build error if this secret-touching module leaks into a client bundle
import crypto from 'crypto';
import { prisma } from '../prisma';
import { HttpError } from '../auth';
import { ingestOrder } from '../orders';

// Shopify connector. Implements the standard OAuth install flow, webhook HMAC
// verification, and resource sync (products, customers, orders) into the
// unified data model. Requires SHOPIFY_API_KEY / SHOPIFY_API_SECRET in .env;
// without them the integrations page shows setup instructions instead.

const API_VERSION = '2024-10';
const SCOPES = 'read_products,read_customers,read_orders';

export function shopifyConfigured(): boolean {
  return !!process.env.SHOPIFY_API_KEY && !!process.env.SHOPIFY_API_SECRET;
}

// Signed OAuth state: <brandId>.<hmac>, verified in the callback so the
// integration can only be attached to the brand that initiated the install.
export function signOAuthState(brandId: string): string {
  const sig = crypto
    .createHmac('sha256', process.env.AUTH_SECRET ?? 'dev')
    .update(brandId)
    .digest('base64url');
  return `${brandId}.${sig}`;
}

export function verifyOAuthState(state: string): string | null {
  const [brandId, sig] = state.split('.');
  if (!brandId || !sig) return null;
  const expected = crypto
    .createHmac('sha256', process.env.AUTH_SECRET ?? 'dev')
    .update(brandId)
    .digest('base64url');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? brandId : null;
  } catch {
    return null;
  }
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export function buildInstallUrl(shopDomain: string, state: string): string {
  if (!shopifyConfigured()) throw new HttpError(400, 'Shopify credentials are not configured');
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shopDomain)) {
    throw new HttpError(400, 'Enter a valid *.myshopify.com domain');
  }
  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_API_KEY!,
    scope: SCOPES,
    redirect_uri: `${appUrl()}/api/integrations/shopify/callback`,
    state,
  });
  return `https://${shopDomain}/admin/oauth/authorize?${params}`;
}

// Verify the HMAC Shopify appends to OAuth callback query strings.
export function verifyCallbackHmac(query: URLSearchParams): boolean {
  const hmac = query.get('hmac') ?? '';
  const rest = new URLSearchParams(
    [...query.entries()].filter(([k]) => k !== 'hmac' && k !== 'signature').sort()
  );
  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(rest.toString())
    .digest('hex');
  return (
    hmac.length === digest.length &&
    crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(hmac, 'hex'))
  );
}

// Verify the HMAC header on incoming webhook bodies.
export function verifyWebhookHmac(rawBody: string, hmacHeader: string): boolean {
  if (!shopifyConfigured() || !hmacHeader) return false;
  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(rawBody, 'utf8')
    .digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

export async function exchangeToken(shopDomain: string, code: string): Promise<string> {
  const res = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });
  if (!res.ok) throw new HttpError(400, `Shopify token exchange failed (${res.status})`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new HttpError(400, 'Shopify token exchange returned no token');
  return data.access_token;
}

async function shopifyGet<T>(shopDomain: string, accessToken: string, path: string): Promise<T> {
  const res = await fetch(`https://${shopDomain}/admin/api/${API_VERSION}/${path}`, {
    headers: { 'X-Shopify-Access-Token': accessToken },
  });
  if (!res.ok) throw new Error(`Shopify GET ${path} failed (${res.status})`);
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Sync: Shopify resources → unified Avori models
// ---------------------------------------------------------------------------

type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  status: string;
  image?: { src: string } | null;
  variants: Array<{ id: number; price: string; sku: string | null }>;
};

type ShopifyCustomer = {
  id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  accepts_marketing?: boolean;
};

type ShopifyOrder = {
  id: number;
  name: string;
  email: string | null;
  created_at: string;
  currency: string;
  subtotal_price: string;
  total_discounts: string;
  total_price: string;
  financial_status: string | null;
  discount_codes: Array<{ code: string }>;
  line_items: Array<{ title: string; sku: string | null; quantity: number; price: string }>;
};

export async function runShopifySync(brandId: string): Promise<{ products: number; customers: number; orders: number }> {
  const integration = await prisma.integration.findUnique({
    where: { brandId_provider: { brandId, provider: 'SHOPIFY' } },
  });
  if (!integration?.accessToken || !integration.shopDomain) {
    throw new HttpError(400, 'Shopify is not connected for this workspace');
  }
  const { shopDomain, accessToken } = integration as { shopDomain: string; accessToken: string };

  // Products
  const { products } = await shopifyGet<{ products: ShopifyProduct[] }>(
    shopDomain,
    accessToken,
    'products.json?limit=250'
  );
  for (const p of products) {
    const variant = p.variants[0];
    const existing = await prisma.product.findFirst({
      where: { brandId, sku: `shopify-${p.id}` },
    });
    const data = {
      name: p.title,
      price: variant ? Number(variant.price) : 0,
      imageUrl: p.image?.src ?? 'https://placehold.co/400x400?text=No+image',
      productUrl: `https://${shopDomain}/products/${p.handle}`,
      status: (p.status === 'active' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
    };
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
    } else {
      await prisma.product.create({ data: { ...data, brandId, sku: `shopify-${p.id}` } });
    }
  }

  // Customers
  const { customers } = await shopifyGet<{ customers: ShopifyCustomer[] }>(
    shopDomain,
    accessToken,
    'customers.json?limit=250'
  );
  for (const c of customers) {
    if (!c.email) continue;
    await prisma.customer.upsert({
      where: { brandId_email: { brandId, email: c.email.toLowerCase() } },
      update: {
        firstName: c.first_name,
        lastName: c.last_name,
        phone: c.phone,
        externalId: String(c.id),
      },
      create: {
        brandId,
        email: c.email.toLowerCase(),
        firstName: c.first_name,
        lastName: c.last_name,
        phone: c.phone,
        acceptsMarketing: c.accepts_marketing ?? false,
        source: 'shopify',
        externalId: String(c.id),
      },
    });
  }

  // Orders (only new ones, dedupe on externalId via orderNumber uniqueness)
  const { orders } = await shopifyGet<{ orders: ShopifyOrder[] }>(
    shopDomain,
    accessToken,
    'orders.json?limit=250&status=any'
  );
  let orderCount = 0;
  for (const o of orders) {
    if (!o.email) continue;
    const exists = await prisma.order.findFirst({
      where: { brandId, externalId: String(o.id) },
      select: { id: true },
    });
    if (exists) continue;
    await ingestOrder(brandId, {
      email: o.email,
      orderNumber: o.name,
      externalId: String(o.id),
      status: o.financial_status === 'refunded' ? 'REFUNDED' : 'PAID',
      currency: o.currency,
      items: o.line_items.map((li) => ({
        name: li.title,
        sku: li.sku ?? undefined,
        quantity: li.quantity,
        price: Number(li.price),
      })),
      subtotal: Number(o.subtotal_price),
      discountTotal: Number(o.total_discounts),
      total: Number(o.total_price),
      discountCodes: o.discount_codes.map((d) => d.code),
      placedAt: new Date(o.created_at),
      source: 'shopify',
    });
    orderCount++;
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { status: 'CONNECTED', lastSyncAt: new Date() },
  });

  return { products: products.length, customers: customers.length, orders: orderCount };
}
