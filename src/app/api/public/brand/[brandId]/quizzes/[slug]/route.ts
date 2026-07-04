import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { quizSubmitSchema } from '@/lib/validation';
import { getPublicQuiz, submitQuiz } from '@/lib/quizzes';

// Public quiz endpoints powering the hosted quiz page and custom embeds.
// Recommendations return immediately after submit; email is optional and
// can also be attached afterwards via the claim endpoint.

async function activeBrand(brandId: string) {
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  return brand && !brand.disabled ? brand : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { brandId: string; slug: string } }
) {
  try {
    const { ok: allowed } = rateLimit(`quiz:${clientIp(req)}`, 300);
    if (!allowed) return fail(new Error('Rate limited'));
    const brand = await activeBrand(params.brandId);
    if (!brand) return fail(new Error('Unknown brand'));
    const quiz = await getPublicQuiz(brand.id, params.slug);
    return ok({ quiz, brand: { name: brand.name } });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { brandId: string; slug: string } }
) {
  try {
    const { ok: allowed } = rateLimit(`quiz-submit:${clientIp(req)}`, 20);
    if (!allowed) return fail(new Error('Rate limited'));
    const brand = await activeBrand(params.brandId);
    if (!brand) return fail(new Error('Unknown brand'));
    const data = quizSubmitSchema.parse(await req.json());
    const result = await submitQuiz(brand.id, params.slug, data.answers, data.email || null);
    return ok(result, 201);
  } catch (e) {
    return fail(e);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
