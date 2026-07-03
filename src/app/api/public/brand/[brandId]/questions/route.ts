import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { questionSubmitSchema } from '@/lib/validation';

// Public "ask a question" submissions from the reviews widget.
export async function POST(req: NextRequest, { params }: { params: { brandId: string } }) {
  try {
    const ip = clientIp(req);
    const { ok: allowed } = rateLimit(`questions:${ip}`, 10);
    if (!allowed) return fail(new Error('Rate limited'));

    const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
    if (!brand || brand.disabled) return fail(new Error('Unknown brand'));

    const data = questionSubmitSchema.parse(await req.json());
    const product = await prisma.product.findFirst({
      where: { id: data.productId, brandId: brand.id },
      select: { id: true },
    });
    if (!product) return fail(new Error('Unknown product'));

    await prisma.productQuestion.create({
      data: {
        brandId: brand.id,
        productId: product.id,
        body: data.body,
        authorName: data.authorName || null,
        authorEmail: data.authorEmail?.toLowerCase() || null,
      },
    });
    return ok({ submitted: true }, 201);
  } catch (e) {
    return fail(e);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
