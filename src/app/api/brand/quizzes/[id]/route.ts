import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { quizSchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const quiz = await prisma.quiz.findFirst({
      where: { id: params.id, brandId },
      include: { questions: { orderBy: { sort: 'asc' } } },
    });
    if (!quiz) throw new HttpError(404, 'Quiz not found');
    return ok({ quiz });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = quizSchema.partial().parse(await req.json());
    const existing = await prisma.quiz.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Quiz not found');
    const quiz = await prisma.quiz.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.slug !== undefined && data.slug ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.leadCapture !== undefined ? { leadCapture: data.leadCapture } : {}),
      },
    });
    return ok({ quiz });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.quiz.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Quiz not found');
    await prisma.quiz.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
