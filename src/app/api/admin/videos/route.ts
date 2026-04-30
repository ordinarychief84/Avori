import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { fail, ok } from '@/lib/http';

export async function GET() {
  try {
    await requireAdmin();
    const videos = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      include: { brand: { select: { id: true, name: true, slug: true } } },
      take: 200,
    });
    return ok({ videos });
  } catch (e) {
    return fail(e);
  }
}
