import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/apikey';
import { HttpError } from '@/lib/auth';
import { customerSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function GET(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const email = new URL(req.url).searchParams.get('email')?.trim().toLowerCase();
    if (!email) throw new HttpError(400, 'email query parameter required');
    const customer = await prisma.customer.findUnique({
      where: { brandId_email: { brandId, email } },
      include: { loyaltyMember: { include: { tier: true } }, creditAccount: true },
    });
    if (!customer) throw new HttpError(404, 'Customer not found');
    return ok({ customer });
  } catch (e) {
    return fail(e);
  }
}

// Upsert by email — the integration-friendly way to sync customers in.
export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireApiKey(req);
    const data = customerSchema.parse(await req.json());
    const email = data.email.toLowerCase();
    const customer = await prisma.customer.upsert({
      where: { brandId_email: { brandId, email } },
      update: {
        ...(data.firstName ? { firstName: data.firstName } : {}),
        ...(data.lastName ? { lastName: data.lastName } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.acceptsMarketing !== undefined ? { acceptsMarketing: data.acceptsMarketing } : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
        ...(data.birthday ? { birthday: new Date(data.birthday) } : {}),
      },
      create: {
        brandId,
        email,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phone: data.phone || null,
        acceptsMarketing: data.acceptsMarketing ?? false,
        tags: data.tags ?? [],
        birthday: data.birthday ? new Date(data.birthday) : null,
        source: 'api',
      },
    });
    return ok({ customer }, 201);
  } catch (e) {
    return fail(e);
  }
}
