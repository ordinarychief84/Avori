import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eventSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';

function hostnameFromHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const { ok: allowed } = rateLimit(`evt:${ip}`);
    if (!allowed) return new Response(null, { status: 429 });

    const data = eventSchema.parse(await req.json());

    // Server-determined domain — never trust the field the client sent.
    // Origin first, then Referer, then null.
    const trustedDomain =
      hostnameFromHeader(req.headers.get('origin')) ||
      hostnameFromHeader(req.headers.get('referer'));

    const brand = await prisma.brand.findUnique({ where: { id: data.brandId } });
    if (!brand || brand.disabled) return ok({ accepted: false });

    if (data.videoId) {
      const v = await prisma.video.findUnique({ where: { id: data.videoId } });
      if (!v || v.brandId !== data.brandId || v.disabled || v.status !== 'ACTIVE') {
        return ok({ accepted: false });
      }
    }
    if (data.productId) {
      const p = await prisma.product.findUnique({ where: { id: data.productId } });
      if (!p || p.brandId !== data.brandId || p.status !== 'ACTIVE') {
        return ok({ accepted: false });
      }
    }

    await prisma.analyticsEvent.create({
      data: {
        brandId: data.brandId,
        videoId: data.videoId ?? null,
        productId: data.productId ?? null,
        type: data.type,
        domain: trustedDomain,
        ip,
        ua: req.headers.get('user-agent')?.slice(0, 300) ?? null,
      },
    });

    if (data.type === 'IMPRESSION' && trustedDomain && data.mode) {
      await prisma.widgetInstall.upsert({
        where: {
          brandId_domain_mode: { brandId: data.brandId, domain: trustedDomain, mode: data.mode },
        },
        update: { lastSeenAt: new Date() },
        create: { brandId: data.brandId, domain: trustedDomain, mode: data.mode },
      });
    }

    return ok({ accepted: true });
  } catch (e) {
    return fail(e);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
