import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signupSchema } from '@/lib/validation';
import { fail, ok, slugify } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = signupSchema.parse(body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return fail(new Error('Email already registered'));

    const baseSlug = slugify(data.brandName) || 'brand';
    let slug = baseSlug;
    let n = 1;
    while (await prisma.brand.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++n}`;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const brand = await prisma.brand.create({
      data: {
        name: data.brandName,
        slug,
        domain: data.domain || null,
      },
    });
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name ?? null,
        passwordHash,
        role: 'BRAND',
        brandId: brand.id,
      },
    });

    return ok({ userId: user.id, brandId: brand.id }, 201);
  } catch (e) {
    return fail(e);
  }
}
