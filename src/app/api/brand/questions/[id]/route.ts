import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { questionAnswerSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = questionAnswerSchema.parse(await req.json());
    const existing = await prisma.productQuestion.findFirst({
      where: { id: params.id, brandId },
    });
    if (!existing) throw new HttpError(404, 'Question not found');

    const question = await prisma.productQuestion.update({
      where: { id: existing.id },
      data: {
        ...(data.answer !== undefined
          ? {
              answer: data.answer || null,
              answeredAt: data.answer ? new Date() : null,
              // Answering publishes by default unless status says otherwise.
              ...(data.answer && data.status === undefined ? { status: 'PUBLISHED' as const } : {}),
            }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
    return ok({ question });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.productQuestion.findFirst({
      where: { id: params.id, brandId },
    });
    if (!existing) throw new HttpError(404, 'Question not found');
    await prisma.productQuestion.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
