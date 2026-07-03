import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBrand, HttpError } from '@/lib/auth';
import { surveySchema } from '@/lib/validation';
import { fail, ok } from '@/lib/http';
import { csvResponse } from '@/lib/csv';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const survey = await prisma.survey.findFirst({
      where: { id: params.id, brandId },
      include: { responses: { orderBy: { createdAt: 'desc' }, take: 1000 } },
    });
    if (!survey) throw new HttpError(404, 'Survey not found');

    if (new URL(req.url).searchParams.get('format') === 'csv') {
      return csvResponse(
        survey.responses.map((r) => ({
          id: r.id,
          score: r.score ?? '',
          answer: r.answer ?? '',
          email: r.email ?? '',
          createdAt: r.createdAt,
        })),
        `survey-${survey.id}-responses.csv`
      );
    }
    return ok({ survey });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const data = surveySchema.partial().parse(await req.json());
    const existing = await prisma.survey.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Survey not found');
    const survey = await prisma.survey.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.question !== undefined ? { question: data.question } : {}),
        ...(data.followUp !== undefined ? { followUp: data.followUp || null } : {}),
      },
    });
    return ok({ survey });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { brandId } = await requireBrand();
    const existing = await prisma.survey.findFirst({ where: { id: params.id, brandId } });
    if (!existing) throw new HttpError(404, 'Survey not found');
    await prisma.survey.delete({ where: { id: existing.id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
