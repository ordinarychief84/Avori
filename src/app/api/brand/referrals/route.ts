import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { ensureReferral } from '@/lib/referrals';
import { audit } from '@/lib/audit';

// Issue a referral code either for an existing customer (customerId) or for
// an advocate by email: employees and influencers get a customer record
// tagged with their kind so their activity stays trackable.
const createSchema = z
  .object({
    customerId: z.string().min(1).optional(),
    email: z.string().email().max(200).optional(),
    name: z.string().max(120).optional().or(z.literal('')),
    kind: z.enum(['CUSTOMER', 'EMPLOYEE', 'INFLUENCER']).optional(),
  })
  .refine((d) => d.customerId || d.email, 'Provide customerId or email');

export async function POST(req: NextRequest) {
  try {
    const { brandId, userId } = await requireBrand();
    const data = createSchema.parse(await req.json());
    const kind = data.kind ?? 'CUSTOMER';

    let customerId = data.customerId;
    if (!customerId) {
      const email = data.email!.toLowerCase();
      const [firstName, ...rest] = (data.name ?? '').trim().split(/\s+/).filter(Boolean);
      const customer = await prisma.customer.upsert({
        where: { brandId_email: { brandId, email } },
        update: {},
        create: {
          brandId,
          email,
          firstName: firstName ?? null,
          lastName: rest.join(' ') || null,
          source: kind.toLowerCase(),
          tags: kind === 'CUSTOMER' ? [] : [kind.toLowerCase()],
        },
      });
      customerId = customer.id;
    } else {
      const exists = await prisma.customer.findFirst({
        where: { id: customerId, brandId },
        select: { id: true },
      });
      if (!exists) throw new HttpError(404, 'Customer not found');
    }

    const referral = await ensureReferral(brandId, customerId, kind);
    await audit({
      brandId,
      userId,
      action: 'referral.issue',
      entity: 'referral',
      entityId: referral.id,
      meta: { kind },
    });
    return ok({ referral }, 201);
  } catch (e) {
    return fail(e);
  }
}
