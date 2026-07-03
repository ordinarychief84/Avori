import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireApiKey } from '@/lib/apikey';
import { fail, ok } from '@/lib/http';
import { track } from '@/lib/events';

const schema = z.object({
  type: z.enum([
    'IMPRESSION',
    'VIEW',
    'TAG_CLICK',
    'CTA_CLICK',
    'QUIZ_VIEW',
    'QUIZ_START',
    'QUIZ_COMPLETE',
    'UPSELL_IMPRESSION',
    'UPSELL_CLICK',
    'BUNDLE_IMPRESSION',
    'BUNDLE_CLICK',
    'REFERRAL_CLICK',
    'SOCIAL_CLICK',
  ]),
  productId: z.string().optional(),
  videoId: z.string().optional(),
  refType: z.string().max(40).optional(),
  refId: z.string().max(60).optional(),
  meta: z.record(z.unknown()).optional(),
});

// Generic analytics ingestion for custom integrations.
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const data = schema.parse(await req.json());
    await track({
      brandId,
      type: data.type,
      productId: data.productId,
      videoId: data.videoId,
      refType: data.refType,
      refId: data.refId,
      meta: data.meta as Record<string, unknown> | undefined,
      ua: req.headers.get('user-agent') ?? undefined,
    });
    return ok({ tracked: true }, 201);
  } catch (e) {
    return fail(e);
  }
}
