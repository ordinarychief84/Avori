import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { productPatchSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { storage } from '@/lib/storage';

async function ownProduct(brandId: string, id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.brandId !== brandId) throw new HttpError(404, 'Not found');
  return product;
}

// Pull the storage key out of a /uploads/<key> URL so we can ask the storage
// provider to clean up the file. Returns null for external URLs the provider
// doesn't own (e.g. a CDN).
function uploadKey(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = /^\/uploads\/(.+)$/.exec(url);
  return m ? m[1] : null;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const product = await ownProduct(brandId, params.id);
    return ok({ product });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    await ownProduct(brandId, params.id);
    const data = productPatchSchema.parse(await req.json());
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...data,
        sku: data.sku === '' ? null : data.sku,
      },
    });
    return ok({ product });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const product = await ownProduct(brandId, params.id);
    await prisma.product.delete({ where: { id: params.id } });
    // Best-effort blob cleanup. Don't fail the request if storage misbehaves —
    // the DB row is already gone and re-running won't help.
    const key = uploadKey(product.imageUrl);
    if (key) {
      try {
        await storage().delete(key);
      } catch {}
    }
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
