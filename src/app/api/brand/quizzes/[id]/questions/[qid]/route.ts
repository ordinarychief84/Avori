import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { quizQuestionSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

async function findQuestion(brandId: string, quizId: string, qid: string) {
  const question = await prisma.quizQuestion.findFirst({
    where: { id: qid, quizId, quiz: { brandId } },
  });
  if (!question) throw new HttpError(404, 'Question not found');
  return question;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const { brandId } = await requireBrand();
    const data = quizQuestionSchema.partial().parse(await req.json());
    const existing = await findQuestion(brandId, params.id, params.qid);
    const question = await prisma.quizQuestion.update({
      where: { id: existing.id },
      data: {
        ...(data.prompt !== undefined ? { prompt: data.prompt } : {}),
        ...(data.helpText !== undefined ? { helpText: data.helpText || null } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.sort !== undefined ? { sort: data.sort } : {}),
        ...(data.options !== undefined ? { options: data.options } : {}),
      },
    });
    return ok({ question });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const { brandId } = await requireBrand();
    const existing = await findQuestion(brandId, params.id, params.qid);
    await prisma.quizQuestion.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
