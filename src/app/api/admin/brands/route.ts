import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { fail, ok } from '@/lib/http';

export async function GET() {
  try {
    await requireAdmin();
    const brands = await prisma.brand.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { videos: true, products: true, users: true } },
      },
    });
    return ok({ brands });
  } catch (e) {
    return fail(e);
  }
}
