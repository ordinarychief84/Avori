import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { claimShadeProfile } from '@/lib/shade';

const schema = z.object({
  profileId: z.string().min(1),
  email: z.string().email().max(200),
});

// "Not ready to buy" lead capture: attach an email to a finished shade
// analysis after the shopper has already seen their matches.
export async function POST(req: NextRequest, { params }: { params: { brandId: string } }) {
  try {
    const { ok: allowed } = rateLimit(`shade-claim:${clientIp(req)}`, 10);
    if (!allowed) return fail(new Error('Rate limited'));
    const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
    if (!brand || brand.disabled) return fail(new Error('Unknown brand'));
    const data = schema.parse(await req.json());
    const result = await claimShadeProfile(brand.id, data.profileId, data.email);
    return ok(result, 201);
  } catch (e) {
    return fail(e);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
