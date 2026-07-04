import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { shadeAnalyzeSchema } from '@/lib/validation';
import { performShadeAnalysis } from '@/lib/shade';

export const maxDuration = 60;

// Public analyzer behind the hosted shade page. Vision calls cost real
// money, so this endpoint is rate-limited hard per IP.
export async function POST(req: NextRequest, { params }: { params: { brandId: string } }) {
  try {
    const { ok: allowed } = rateLimit(`shade-analyze:${clientIp(req)}`, 3);
    if (!allowed) return fail(new Error('Rate limited, try again in a minute'));
    const brand = await prisma.brand.findUnique({ where: { id: params.brandId } });
    if (!brand || brand.disabled) return fail(new Error('Unknown brand'));

    const data = shadeAnalyzeSchema.parse(await req.json());
    const result = await performShadeAnalysis(brand.id, {
      imageBase64: data.imageBase64,
      mediaType: data.mediaType,
      email: data.email || null,
      intake: data.intake,
      source: 'hosted',
    });
    return ok(result, 201);
  } catch (e) {
    return fail(e);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
