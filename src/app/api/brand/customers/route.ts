import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { customerSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function GET(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim();
    const rawLimit = Number(url.searchParams.get('limit') ?? 100);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 100;
    const cursor = url.searchParams.get('cursor') || undefined;

    const customers = await prisma.customer.findMany({
      where: {
        brandId,
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = customers.length > limit;
    const page = hasMore ? customers.slice(0, limit) : customers;
    return ok({ customers: page, nextCursor: hasMore ? page[page.length - 1].id : null });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = customerSchema.parse(await req.json());
    const customer = await prisma.customer.create({
      data: {
        brandId,
        email: data.email.toLowerCase(),
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phone: data.phone || null,
        acceptsMarketing: data.acceptsMarketing ?? false,
        tags: data.tags ?? [],
        birthday: data.birthday ? new Date(data.birthday) : null,
        notes: data.notes || null,
        source: 'manual',
      },
    });
    return ok({ customer }, 201);
  } catch (e) {
    return fail(e);
  }
}
