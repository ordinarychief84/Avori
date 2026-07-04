import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { claimQuizResponse } from '@/lib/quizzes';

const schema = z.object({
  responseId: z.string().min(1),
  email: z.string().email().max(200),
});

// "Not ready to buy" lead capture: attach an email to a finished quiz
// response after the shopper has already seen their recommendations.
export async function POST(req: NextRequest, { params }: { params: { brandId: string } }) {
  try {
    const { ok: allowed } = rateLimit(`quiz-claim:${clientIp(req)}`, 10);
    if (!allowed) return fail(new Error('Rate limited'));
    const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
    if (!brand || brand.disabled) return fail(new Error('Unknown brand'));
    const data = schema.parse(await req.json());
    const result = await claimQuizResponse(brand.id, data.responseId, data.email);
    return ok(result, 201);
  } catch (e) {
    return fail(e);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
