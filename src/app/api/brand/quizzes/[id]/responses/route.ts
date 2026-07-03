import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { csvResponse } from '@/lib/csv';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const quiz = await prisma.quiz.findFirst({ where: { id: params.id, brandId } });
    if (!quiz) throw new HttpError(404, 'Quiz not found');

    const responses = await prisma.quizResponse.findMany({
      where: { quizId: quiz.id },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    if (new URL(req.url).searchParams.get('format') === 'csv') {
      return csvResponse(
        responses.map((r) => ({
          id: r.id,
          email: r.email ?? '',
          completed: r.completedAt ? 'yes' : 'no',
          answers: JSON.stringify(r.answers),
          recommendedProducts: r.recommendedProductIds.join('; '),
          createdAt: r.createdAt,
        })),
        `quiz-${quiz.slug}-responses.csv`
      );
    }
    return ok({ responses });
  } catch (e) {
    return fail(e);
  }
}
