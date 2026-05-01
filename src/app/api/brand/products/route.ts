import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { productSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function GET(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    // Optional pagination via ?limit=N&cursor=<id>. Default limit guards
    // against runaway responses on a brand with thousands of products.
    const url = new URL(req.url);
    const rawLimit = Number(url.searchParams.get('limit') ?? 100);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 100;
    const cursor = url.searchParams.get('cursor') || undefined;
    const products = await prisma.product.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = products.length > limit;
    const page = hasMore ? products.slice(0, limit) : products;
    const nextCursor = hasMore ? page[page.length - 1].id : null;
    return ok({ products: page, nextCursor });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = productSchema.parse(await req.json());
    const product = await prisma.product.create({
      data: {
        brandId,
        name: data.name,
        price: data.price,
        imageUrl: data.imageUrl,
        productUrl: data.productUrl,
        sku: data.sku || null,
        status: data.status,
        tryOnEnabled: data.tryOnEnabled ?? false,
        tryOnCategory: data.tryOnCategory ?? 'NONE',
        tryOnTint: data.tryOnTint ?? null,
      },
    });
    return ok({ product }, 201);
  } catch (e) {
    return fail(e);
  }
}
