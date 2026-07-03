import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireApiKey } from '@/lib/apikey';
import { fail, ok } from '@/lib/http';
import { recordReferralClick } from '@/lib/referrals';

const schema = z.object({ code: z.string().min(1).max(60) });

// Track a referral link visit. Conversion happens automatically when an
// order arrives with `referralCode` set.
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const { code } = schema.parse(await req.json());
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      undefined;
    const referral = await recordReferralClick(brandId, code, ip);
    return ok({ tracked: !!referral, discountHint: referral ? 'refereeDiscountPct applies on first order' : null });
  } catch (e) {
    return fail(e);
  }
}
