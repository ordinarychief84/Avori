import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { signupSchema } from '@/lib/validation';
import { fail, ok, slugify } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { HttpError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const { ok: allowed } = rateLimit(`signup:${ip}`, 5);
    if (!allowed) throw new HttpError(429, 'Too many signups from this address');

    const data = signupSchema.parse(await req.json());

    // Note: avoid revealing whether an email is registered. Same generic error
    // for "exists" and validation failure further down.
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new HttpError(409, "Couldn't create account — try logging in");

    const passwordHash = await bcrypt.hash(data.password, 10);
    const baseSlug = slugify(data.brandName) || 'brand';

    const result = await prisma.$transaction(async (tx) => {
      // Pick a unique slug. Race-safe: append a random suffix on collision.
      let slug = baseSlug;
      for (let attempt = 0; attempt < 5; attempt++) {
        const taken = await tx.brand.findUnique({ where: { slug } });
        if (!taken) break;
        slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      }
      const brand = await tx.brand.create({
        data: { name: data.brandName, slug, domain: data.domain || null },
      });
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.name ?? null,
          passwordHash,
          role: 'BRAND',
          brandId: brand.id,
        },
      });
      return { user, brand };
    });

    return ok({ userId: result.user.id, brandId: result.brand.id }, 201);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      // Unique constraint races (slug or email)
      return fail(new HttpError(409, "Couldn't create account — try logging in"));
    }
    return fail(e);
  }
}
