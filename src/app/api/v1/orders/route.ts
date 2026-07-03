import { NextRequest } from 'next/server';
import { requireApiKey } from '@/lib/apikey';
import { orderCreateSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { ingestOrder } from '@/lib/orders';

// Order ingestion for custom-platform stores. Feeds the entire platform:
// unified customer stats, loyalty earn, referral conversion, review requests,
// analytics and webhooks.
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const data = orderCreateSchema.parse(await req.json());
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      undefined;
    const order = await ingestOrder(brandId, {
      ...data,
      placedAt: data.placedAt ? new Date(data.placedAt) : undefined,
      source: 'api',
      ip,
    });
    return ok({ order }, 201);
  } catch (e) {
    return fail(e);
  }
}
