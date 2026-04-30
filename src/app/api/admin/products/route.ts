import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { fail, ok } from '@/lib/http';

export async function GET() {
  try {
    await requireAdmin();
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { brand: { select: { id: true, name: true, slug: true } } },
      take: 200,
    });
    return ok({ products });
  } catch (e) {
    return fail(e);
  }
}
