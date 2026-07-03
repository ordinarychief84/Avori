import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { generateInsights } from '@/lib/ai';

export async function GET() {
  try {
    const { brandId } = await requireBrand();
    const insights = await prisma.aiInsight.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
    });
    return ok({ insights });
  } catch (e) {
    return fail(e);
  }
}

export async function POST() {
  try {
    const { brandId } = await requireBrand();
    const insights = await generateInsights(brandId);
    return ok({ insights });
  } catch (e) {
    return fail(e);
  }
}
