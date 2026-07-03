import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { quizQuestionSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = quizQuestionSchema.parse(await req.json());
    const quiz = await prisma.quiz.findFirst({ where: { id: params.id, brandId } });
    if (!quiz) throw new HttpError(404, 'Quiz not found');

    const maxSort = await prisma.quizQuestion.aggregate({
      where: { quizId: quiz.id },
      _max: { sort: true },
    });
    const question = await prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        prompt: data.prompt,
        helpText: data.helpText || null,
        type: data.type ?? 'SINGLE_CHOICE',
        sort: data.sort ?? (maxSort._max.sort ?? -1) + 1,
        options: data.options ?? [],
      },
    });
    return ok({ question }, 201);
  } catch (e) {
    return fail(e);
  }
}
