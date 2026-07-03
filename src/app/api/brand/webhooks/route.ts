import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { webhookEndpointSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = webhookEndpointSchema.parse(await req.json());
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        brandId,
        url: data.url,
        topics: data.topics ?? [],
        active: data.active ?? true,
        secret: `whsec_${crypto.randomBytes(24).toString('base64url')}`,
      },
    });
    // Secret is shown once at creation so it can be stored by the receiver.
    return ok({ endpoint }, 201);
  } catch (e) {
    return fail(e);
  }
}
