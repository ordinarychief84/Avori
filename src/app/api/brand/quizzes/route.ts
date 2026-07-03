import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand } from '@/lib/auth';
import { quizSchema } from '@/lib/validation';
import { fail, ok, slugify } from '@/lib/http';

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await requireBrand();
    const data = quizSchema.parse(await req.json());
    const base = data.slug || slugify(data.title) || 'quiz';

    // Deduplicate the slug within the brand.
    let slug = base;
    for (let i = 2; ; i++) {
      const taken = await prisma.quiz.findUnique({
        where: { brandId_slug: { brandId, slug } },
        select: { id: true },
      });
      if (!taken) break;
      slug = `${base}-${i}`;
    }

    const quiz = await prisma.quiz.create({
      data: {
        brandId,
        title: data.title,
        slug,
        description: data.description || null,
        status: data.status ?? 'DRAFT',
        leadCapture: data.leadCapture ?? true,
      },
    });
    return ok({ quiz }, 201);
  } catch (e) {
    return fail(e);
  }
}
