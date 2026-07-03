import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireBrand } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { ensureReferral } from '@/lib/referrals';

const createSchema = z.object({ customerId: z.string().min(1) });

// Issue (or fetch) a referral code for a customer.
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const { customerId } = createSchema.parse(await req.json());
    const referral = await ensureReferral(brandId, customerId);
    return ok({ referral }, 201);
  } catch (e) {
    return fail(e);
  }
}
